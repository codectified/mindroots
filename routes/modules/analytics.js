const express = require('express');
const neo4j   = require('neo4j-driver');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const toNum = v => {
  if (v == null) return 0;
  if (neo4j.isInt(v)) return v.toNumber();
  if (typeof v === 'object' && 'low' in v) return neo4j.int(v.low, v.high).toNumber();
  return Number(v);
};

// ── Persistent disk cache ────────────────────────────────────────────────────
// Survives server restarts. Stored alongside this module.
const CACHE_FILE = path.join(__dirname, 'analytics-cache.json');
const CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 hours

let cache = {};
try {
  const raw = fs.readFileSync(CACHE_FILE, 'utf8');
  cache = JSON.parse(raw);
  // prune stale entries on load
  const now = Date.now();
  Object.keys(cache).forEach(k => { if (now - cache[k].ts > CACHE_TTL) delete cache[k]; });
  console.log(`[analytics] loaded ${Object.keys(cache).length} cache entries from disk`);
} catch (_) {
  // no cache file yet — start fresh
}

const saveCache = () => {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)); } catch (_) {}
};

const cached = async (key, fn) => {
  const hit = cache[key];
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  const data = await fn();
  cache[key] = { data, ts: Date.now() };
  saveCache();
  return data;
};

// ── Query helpers ────────────────────────────────────────────────────────────
// Graph traversal: (CorpusItem)-[:HAS_WORD]->(Word)<-[:HAS_WORD]-(Root)
// surahFilter returns an AND clause for WHERE, or empty string.
const surahFilter = (surah) =>
  surah ? `AND toInteger(split(ci.item_id, ':')[0]) = toInteger($surah)` : '';

// ── Routes ───────────────────────────────────────────────────────────────────

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
        result = await session.run(`
          MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)
          WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL ${surahFilter(surah)}
          WITH r.r1 + '-' + r.r2 AS pair_key,
               count(DISTINCT r) AS root_count,
               count(DISTINCT w) AS total_words,
               count(w)          AS total_corpus
          RETURN pair_key, root_count, total_words, total_corpus, 0 AS avg_forms
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
// Single traversal via UNWIND instead of 3× UNION ALL — 3× cheaper for corpus queries.
router.get('/analytics/radical-positions', async (req, res) => {
  const { corpus_id, surah } = req.query;
  const session = req.driver.session();
  try {
    const cacheKey = `positions:${corpus_id || 'all'}:${surah || ''}`;
    const data = await cached(cacheKey, async () => {
      let result;
      if (corpus_id) {
        // Aggregate per Root FIRST (collapses 73K CorpusItem rows → ~1K Root rows),
        // then unwind positions on the small aggregated table — stays within memory limits.
        result = await session.run(`
          MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)
          WHERE (r.r1 IS NOT NULL OR r.r2 IS NOT NULL OR r.r3 IS NOT NULL) ${surahFilter(surah)}
          WITH r, count(DISTINCT w) AS words, count(w) AS corpus
          UNWIND [
            CASE WHEN r.r1 IS NOT NULL THEN {rad: r.r1, pos: 'r1'} ELSE null END,
            CASE WHEN r.r2 IS NOT NULL THEN {rad: r.r2, pos: 'r2'} ELSE null END,
            CASE WHEN r.r3 IS NOT NULL THEN {rad: r.r3, pos: 'r3'} ELSE null END
          ] AS rp
          WITH words, corpus, rp WHERE rp IS NOT NULL
          WITH rp.rad AS radical, rp.pos AS position, words, corpus
          WITH radical, position,
               count(*) AS roots,
               sum(words) AS words,
               sum(corpus) AS corpus
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
        result = await session.run(`
          MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)
          WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL AND r.r3 IS NOT NULL ${surahFilter(surah)}
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

// GET /analytics/top-roots[?corpus_id=2[&surah=36]]
router.get('/analytics/top-roots', async (req, res) => {
  const { corpus_id, surah } = req.query;
  const session = req.driver.session();
  try {
    const cacheKey = `top-roots:${corpus_id || 'all'}:${surah || ''}`;
    const data = await cached(cacheKey, async () => {
      let result;
      if (corpus_id) {
        result = await session.run(`
          MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)
          WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL AND r.r3 IS NOT NULL ${surahFilter(surah)}
          WITH r, count(DISTINCT w) AS words, count(w) AS corpus
          RETURN r.r1 AS r1, r.r2 AS r2, r.r3 AS r3, words, corpus
          ORDER BY corpus DESC
          LIMIT 20
        `, { corpusId: corpus_id, surah: surah || null });
      } else {
        result = await session.run(`
          MATCH (r:Root)
          WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL AND r.r3 IS NOT NULL
          RETURN r.r1 AS r1, r.r2 AS r2, r.r3 AS r3,
                 r.feature_word_count   AS words,
                 r.feature_corpus_count AS corpus
          ORDER BY corpus DESC
          LIMIT 20
        `);
      }
      return result.records.map(r => ({
        r1:     r.get('r1'),
        r2:     r.get('r2'),
        r3:     r.get('r3'),
        words:  toNum(r.get('words')),
        corpus: toNum(r.get('corpus')),
      }));
    });
    res.json({ roots: data });
  } catch (err) {
    console.error('[analytics/top-roots]', err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
