const express = require('express');
const neo4j   = require('neo4j-driver');
const router  = express.Router();

const toNum = v => {
  if (v == null) return 0;
  if (neo4j.isInt(v)) return v.toNumber();
  if (typeof v === 'object' && 'low' in v) return neo4j.int(v.low, v.high).toNumber();
  return Number(v);
};

// GET /analytics/biradicals
// Returns every BiRadicalCluster with fertility + gravity metrics
router.get('/analytics/biradicals', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (b:BiRadicalCluster)
      RETURN b.pair_key    AS pair_key,
             b.root_count  AS root_count,
             b.total_words AS total_words,
             b.total_corpus AS total_corpus,
             b.avg_forms   AS avg_forms
      ORDER BY b.total_corpus DESC
    `);
    res.json({
      biradicals: result.records.map(r => ({
        pair_key:     r.get('pair_key'),
        root_count:   toNum(r.get('root_count')),
        total_words:  toNum(r.get('total_words')),
        total_corpus: toNum(r.get('total_corpus')),
        avg_forms:    toNum(r.get('avg_forms')),
      })),
    });
  } catch (err) {
    console.error('[analytics/biradicals]', err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// GET /analytics/radical-positions
// Per-radical aggregates split by position (r1 / r2 / r3)
router.get('/analytics/radical-positions', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
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
    res.json({
      positions: result.records.map(r => ({
        radical:  r.get('radical'),
        position: r.get('position'),
        roots:    toNum(r.get('roots')),
        words:    toNum(r.get('words')),
        corpus:   toNum(r.get('corpus')),
      })),
    });
  } catch (err) {
    console.error('[analytics/radical-positions]', err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// GET /analytics/r3-depth
// For each r1-r2 pair, how many distinct r3 completions exist in Root nodes
router.get('/analytics/r3-depth', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (r:Root)
      WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL AND r.r3 IS NOT NULL
      WITH r.r1 + '-' + r.r2 AS pair_key,
           count(DISTINCT r.r3)    AS r3_count,
           collect(DISTINCT r.r3)  AS r3_values
      RETURN pair_key, r3_count, r3_values
      ORDER BY r3_count DESC
    `);
    res.json({
      depths: result.records.map(r => ({
        pair_key:  r.get('pair_key'),
        r3_count:  toNum(r.get('r3_count')),
        r3_values: r.get('r3_values'),
      })),
    });
  } catch (err) {
    console.error('[analytics/r3-depth]', err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
