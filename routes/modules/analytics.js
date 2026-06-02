const express = require('express');
const neo4j   = require('neo4j-driver');
const router  = express.Router();

const toNum = v => {
  if (v == null) return 0;
  if (neo4j.isInt(v)) return v.toNumber();
  if (typeof v === 'object' && 'low' in v) return neo4j.int(v.low, v.high).toNumber();
  return Number(v);
};

// In-memory cache (avoids repeated expensive corpus traversals)
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const cached = async (key, fn) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  const data = await fn();
  cache.set(key, { data, ts: Date.now() });
  return data;
};

// Build the CorpusItem MATCH clause depending on filter params.
// Uses corpus_id property on CorpusItem (same pattern as all other corpus routes).
// surah filter: Quran item_id format is "surah:ayah:word" — filter on first segment.
const corpusClause = (corpus_id, surah) => {
  if (surah) {
    return `
      MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})
      WITH ci, split(ci.item_id, ':') AS parts
      WHERE toInteger(parts[0]) = toInteger($surah)
    `;
  }
  return `MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})`;
};

// GET /analytics/corpora
router.get('/analytics/corpora', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (c:Corpus)
      RETURN c.corpus_id AS corpus_id, c.name AS name
      ORDER BY c.corpus_id
    `);
    res.json({
      corpora: result.records.map(r => ({
        corpus_id: toNum(r.get('corpus_id')),
        name:      r.get('name') || `Corpus ${toNum(r.get('corpus_id'))}`,
      })),
    });
  } catch (err) {
    console.error('[analytics/corpora]', err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// GET /analytics/biradicals[?corpus_id=2[&surah=36]]
router.get('/analytics/biradicals', async (req, res) => {
  const { corpus_id, surah } = req.query;
  const session = req.driver.session();
  try {
    const cacheKey = `biradicals:${corpus_id || 'all'}:${surah || ''}`;
    const data = await cached(cacheKey, async () => {
      let result;
      if (corpus_id) {
        const clause = corpusClause(corpus_id, surah);
        result = await session.run(`
          ${clause}
          WITH ci
          MATCH (ci)-[:HAS_WORD]->(w:Word)-[:HAS_ROOT]->(r:Root)
          WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL
          WITH r.r1 + '-' + r.r2 AS pair_key,
               count(DISTINCT r) AS root_count,
               count(DISTINCT w) AS total_words,
               count(w)          AS total_corpus
          RETURN pair_key, root_count, total_words, total_corpus
          ORDER BY total_corpus DESC
        `, { corpusId: corpus_id, surah: surah || null });
      } else {
        result = await session.run(`
          MATCH (b:BiRadicalCluster)
          RETURN b.pair_key     AS pair_key,
                 b.root_count   AS root_count,
                 b.total_words  AS total_words,
                 b.total_corpus AS total_corpus,
                 b.avg_forms    AS avg_forms
          ORDER BY b.total_corpus DESC
        `);
      }
      return result.records.map(r => ({
        pair_key:     r.get('pair_key'),
        root_count:   toNum(r.get('root_count')),
        total_words:  toNum(r.get('total_words')),
        total_corpus: toNum(r.get('total_corpus')),
        avg_forms:    toNum(r.get('avg_forms') ?? 0),
      }));
    });
    res.json({ biradicals: data });
  } catch (err) {
    console.error('[analytics/biradicals]', err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// GET /analytics/radical-positions[?corpus_id=2[&surah=36]]
router.get('/analytics/radical-positions', async (req, res) => {
  const { corpus_id, surah } = req.query;
  const session = req.driver.session();
  try {
    const cacheKey = `positions:${corpus_id || 'all'}:${surah || ''}`;
    const data = await cached(cacheKey, async () => {
      let result;
      if (corpus_id) {
        const clause = corpusClause(corpus_id, surah);
        result = await session.run(`
          ${clause}
          WITH ci
          MATCH (ci)-[:HAS_WORD]->(w:Word)-[:HAS_ROOT]->(r:Root)
          WHERE r.r1 IS NOT NULL
          WITH r.r1 AS radical, 'r1' AS position,
               count(DISTINCT r) AS roots, count(DISTINCT w) AS words, count(w) AS corpus
          RETURN radical, position, roots, words, corpus
          UNION ALL
          ${clause}
          WITH ci
          MATCH (ci)-[:HAS_WORD]->(w:Word)-[:HAS_ROOT]->(r:Root)
          WHERE r.r2 IS NOT NULL
          WITH r.r2 AS radical, 'r2' AS position,
               count(DISTINCT r) AS roots, count(DISTINCT w) AS words, count(w) AS corpus
          RETURN radical, position, roots, words, corpus
          UNION ALL
          ${clause}
          WITH ci
          MATCH (ci)-[:HAS_WORD]->(w:Word)-[:HAS_ROOT]->(r:Root)
          WHERE r.r3 IS NOT NULL
          WITH r.r3 AS radical, 'r3' AS position,
               count(DISTINCT r) AS roots, count(DISTINCT w) AS words, count(w) AS corpus
          RETURN radical, position, roots, words, corpus
          ORDER BY radical
        `, { corpusId: corpus_id, surah: surah || null });
      } else {
        result = await session.run(`
          MATCH (r:Root) WHERE r.r1 IS NOT NULL
          WITH r.r1 AS radical, 'r1' AS position,
               count(r) AS roots,
               sum(r.feature_word_count)   AS words,
               sum(r.feature_corpus_count) AS corpus
          RETURN radical, position, roots, words, corpus
          UNION ALL
          MATCH (r:Root) WHERE r.r2 IS NOT NULL
          WITH r.r2 AS radical, 'r2' AS position,
               count(r) AS roots,
               sum(r.feature_word_count)   AS words,
               sum(r.feature_corpus_count) AS corpus
          RETURN radical, position, roots, words, corpus
          UNION ALL
          MATCH (r:Root) WHERE r.r3 IS NOT NULL
          WITH r.r3 AS radical, 'r3' AS position,
               count(r) AS roots,
               sum(r.feature_word_count)   AS words,
               sum(r.feature_corpus_count) AS corpus
          RETURN radical, position, roots, words, corpus
          ORDER BY radical
        `);
      }
      return result.records.map(r => ({
        radical:  r.get('radical'),
        position: r.get('position'),
        roots:    toNum(r.get('roots')),
        words:    toNum(r.get('words')),
        corpus:   toNum(r.get('corpus')),
      }));
    });
    res.json({ positions: data });
  } catch (err) {
    console.error('[analytics/radical-positions]', err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// GET /analytics/r3-depth[?corpus_id=2[&surah=36]]
router.get('/analytics/r3-depth', async (req, res) => {
  const { corpus_id, surah } = req.query;
  const session = req.driver.session();
  try {
    const cacheKey = `depth:${corpus_id || 'all'}:${surah || ''}`;
    const data = await cached(cacheKey, async () => {
      let result;
      if (corpus_id) {
        const clause = corpusClause(corpus_id, surah);
        result = await session.run(`
          ${clause}
          WITH ci
          MATCH (ci)-[:HAS_WORD]->(w:Word)-[:HAS_ROOT]->(r:Root)
          WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL AND r.r3 IS NOT NULL
          WITH r.r1 + '-' + r.r2 AS pair_key,
               count(DISTINCT r.r3)   AS r3_count,
               collect(DISTINCT r.r3) AS r3_values
          RETURN pair_key, r3_count, r3_values
          ORDER BY r3_count DESC
        `, { corpusId: corpus_id, surah: surah || null });
      } else {
        result = await session.run(`
          MATCH (r:Root)
          WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL AND r.r3 IS NOT NULL
          WITH r.r1 + '-' + r.r2 AS pair_key,
               count(DISTINCT r.r3)   AS r3_count,
               collect(DISTINCT r.r3) AS r3_values
          RETURN pair_key, r3_count, r3_values
          ORDER BY r3_count DESC
        `);
      }
      return result.records.map(r => ({
        pair_key:  r.get('pair_key'),
        r3_count:  toNum(r.get('r3_count')),
        r3_values: r.get('r3_values'),
      }));
    });
    res.json({ depths: data });
  } catch (err) {
    console.error('[analytics/r3-depth]', err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
