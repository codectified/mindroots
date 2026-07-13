const express = require('express');
const path    = require('path');
const { toNum } = require('./lib/numeric');
const { makeDiskCache } = require('./lib/diskCache');
const router  = express.Router();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const { cached } = makeDiskCache(path.join(__dirname, 'projection-cache.json'), CACHE_TTL);

// A Neo4j session runs only one query at a time, so concurrent queries (Promise.all)
// each need their own session — sharing one throws "open transaction" errors.
const runQuery = async (driver, cypher, params) => {
  const session = driver.session();
  try {
    return await session.run(cypher, params);
  } finally {
    await session.close();
  }
};

// surah filter is Quran-only (corpus_id=2), matches item_id's leading "surah:" segment
const surahFilter = (surah) =>
  surah ? `AND toInteger(split(ci.item_id, ':')[0]) = toInteger($surah)` : '';

const CORPUS_LABELS = { 1: 'Poetry', 2: "Qur'an", 3: 'Prose' };

const mapBranch = (r) => ({
  key:      r.get('branch_key'),
  label:    r.get('branch_key'),
  roots:    toNum(r.get('roots')),
  words:    toNum(r.get('words')),
  corpus:   toNum(r.get('corpus')),
  examples: (r.get('examples') || []).map(e => ({
    r1:      e.r1 ?? null,
    r2:      e.r2 ?? null,
    r3:      e.r3 ?? null,
    arabic:  e.arabic ?? null,
    english: e.english ?? null,
    corpus:  toNum(e.corpus),
  })),
  satellites: [],
});

const buildMeta = (branches) => ({
  total_branches: branches.length,
  total_roots:    branches.reduce((s, b) => s + b.roots, 0),
  total_words:    branches.reduce((s, b) => s + b.words, 0),
  total_corpus:   branches.reduce((s, b) => s + b.corpus, 0),
});

const SATELLITE_LIMIT = 3;

// Groups flat {position, partner, roots, words, corpus} rows into
// { r1: [top 3 partners by corpus], r2: [...], r3: [...] }
const groupSatellites = (records) => {
  const byPosition = { r1: [], r2: [], r3: [] };
  records.forEach(r => {
    const position = r.get('position');
    if (!byPosition[position]) return;
    byPosition[position].push({
      key:    r.get('partner'),
      label:  r.get('partner'),
      roots:  toNum(r.get('roots')),
      words:  toNum(r.get('words')),
      corpus: toNum(r.get('corpus')),
    });
  });
  Object.keys(byPosition).forEach(pos => {
    byPosition[pos] = byPosition[pos]
      .sort((a, b) => b.corpus - a.corpus)
      .slice(0, SATELLITE_LIMIT);
  });
  return byPosition;
};

// ── Projection: by_position (center = single radical) ──────────────────────
async function byPosition(driver, radical, corpusId, surah) {
  let branchResult, satelliteResult;
  if (corpusId) {
    [branchResult, satelliteResult] = await Promise.all([
      runQuery(driver, `
        MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)
        WHERE (r.r1 = $radical OR r.r2 = $radical OR r.r3 = $radical) ${surahFilter(surah)}
        WITH r, count(DISTINCT w) AS words, count(w) AS corpus
        WITH r, words, corpus,
             CASE WHEN r.r1 = $radical THEN 'r1' END AS m1,
             CASE WHEN r.r2 = $radical THEN 'r2' END AS m2,
             CASE WHEN r.r3 = $radical THEN 'r3' END AS m3
        UNWIND [m1, m2, m3] AS position
        WITH r, position, words, corpus WHERE position IS NOT NULL
        WITH r, position, words, corpus ORDER BY corpus DESC
        WITH position AS branch_key,
             count(r) AS roots,
             sum(words) AS words,
             sum(corpus) AS corpus,
             collect({r1: r.r1, r2: r.r2, r3: r.r3, arabic: r.arabic, english: r.english, corpus: corpus})[0..5] AS examples
        RETURN branch_key, roots, words, corpus, examples
        ORDER BY branch_key
      `, { corpusId, radical, surah: surah || null }),
      runQuery(driver, `
        MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)
        WHERE (r.r1 = $radical OR r.r2 = $radical OR r.r3 = $radical) ${surahFilter(surah)}
        WITH r, count(DISTINCT w) AS words, count(w) AS corpus
        WITH r, words, corpus,
             CASE WHEN r.r1 = $radical THEN {position: 'r1', partner: r.r2} END AS m1,
             CASE WHEN r.r2 = $radical THEN {position: 'r2', partner: r.r1} END AS m2,
             CASE WHEN r.r3 = $radical THEN {position: 'r3', partner: r.r1 + '-' + r.r2} END AS m3
        UNWIND [m1, m2, m3] AS match
        WITH match, words, corpus WHERE match IS NOT NULL AND match.partner IS NOT NULL
        WITH match.position AS position, match.partner AS partner, words, corpus
        WITH position, partner,
             count(*) AS roots,
             sum(words) AS words,
             sum(corpus) AS corpus
        RETURN position, partner, roots, words, corpus
        ORDER BY position, corpus DESC
      `, { corpusId, radical, surah: surah || null }),
    ]);
  } else {
    [branchResult, satelliteResult] = await Promise.all([
      runQuery(driver, `
        MATCH (r:Root)
        WHERE r.r1 = $radical OR r.r2 = $radical OR r.r3 = $radical
        WITH r,
             CASE WHEN r.r1 = $radical THEN 'r1' END AS m1,
             CASE WHEN r.r2 = $radical THEN 'r2' END AS m2,
             CASE WHEN r.r3 = $radical THEN 'r3' END AS m3
        UNWIND [m1, m2, m3] AS position
        WITH r, position WHERE position IS NOT NULL
        WITH r, position ORDER BY r.feature_corpus_count DESC
        WITH position AS branch_key,
             count(r) AS roots,
             sum(r.feature_word_count) AS words,
             sum(r.feature_corpus_count) AS corpus,
             collect({r1: r.r1, r2: r.r2, r3: r.r3, arabic: r.arabic, english: r.english, corpus: r.feature_corpus_count})[0..5] AS examples
        RETURN branch_key, roots, words, corpus, examples
        ORDER BY branch_key
      `, { radical }),
      runQuery(driver, `
        MATCH (r:Root)
        WHERE r.r1 = $radical OR r.r2 = $radical OR r.r3 = $radical
        WITH r,
             CASE WHEN r.r1 = $radical THEN {position: 'r1', partner: r.r2} END AS m1,
             CASE WHEN r.r2 = $radical THEN {position: 'r2', partner: r.r1} END AS m2,
             CASE WHEN r.r3 = $radical THEN {position: 'r3', partner: r.r1 + '-' + r.r2} END AS m3
        UNWIND [m1, m2, m3] AS match
        WITH match, r WHERE match IS NOT NULL AND match.partner IS NOT NULL
        WITH match.position AS position, match.partner AS partner,
             count(r) AS roots,
             sum(r.feature_word_count) AS words,
             sum(r.feature_corpus_count) AS corpus
        RETURN position, partner, roots, words, corpus
        ORDER BY position, corpus DESC
      `, { radical }),
    ]);
  }
  const branches = branchResult.records.map(mapBranch);
  const satellitesByPosition = groupSatellites(satelliteResult.records);
  branches.forEach(b => { b.satellites = satellitesByPosition[b.key] || []; });
  return { branches };
}

// ── Projection: r3_completions (center = biradical r1-r2 pair) ─────────────
async function r3Completions(driver, r1, r2, corpusId, surah) {
  let branchResult, coreResult;
  if (corpusId) {
    [branchResult, coreResult] = await Promise.all([
      runQuery(driver, `
        MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)
        WHERE r.r1 = $r1 AND r.r2 = $r2 AND r.r3 IS NOT NULL ${surahFilter(surah)}
        WITH r, count(DISTINCT w) AS words, count(w) AS corpus
        WITH r, words, corpus ORDER BY corpus DESC
        WITH r.r3 AS branch_key,
             count(r) AS roots,
             sum(words) AS words,
             sum(corpus) AS corpus,
             collect({arabic: r.arabic, english: r.english, corpus: corpus})[0..5] AS examples
        RETURN branch_key, roots, words, corpus, examples
        ORDER BY corpus DESC
      `, { corpusId, r1, r2, surah: surah || null }),
      runQuery(driver, `
        MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)
        WHERE r.r1 = $r1 AND r.r2 = $r2 AND r.r3 IS NULL ${surahFilter(surah)}
        RETURN count(DISTINCT r) AS roots, count(DISTINCT w) AS words, count(w) AS corpus
      `, { corpusId, r1, r2, surah: surah || null }),
    ]);
  } else {
    [branchResult, coreResult] = await Promise.all([
      runQuery(driver, `
        MATCH (r:Root)
        WHERE r.r1 = $r1 AND r.r2 = $r2 AND r.r3 IS NOT NULL
        WITH r ORDER BY r.feature_corpus_count DESC
        WITH r.r3 AS branch_key,
             count(r) AS roots,
             sum(r.feature_word_count) AS words,
             sum(r.feature_corpus_count) AS corpus,
             collect({arabic: r.arabic, english: r.english, corpus: r.feature_corpus_count})[0..5] AS examples
        RETURN branch_key, roots, words, corpus, examples
        ORDER BY corpus DESC
      `, { r1, r2 }),
      runQuery(driver, `
        MATCH (r:Root)
        WHERE r.r1 = $r1 AND r.r2 = $r2 AND r.r3 IS NULL
        RETURN count(r) AS roots, sum(r.feature_word_count) AS words, sum(r.feature_corpus_count) AS corpus
      `, { r1, r2 }),
    ]);
  }
  const branches = branchResult.records.map(mapBranch);
  const coreRow = coreResult.records[0];
  const coreStats = coreRow
    ? { roots: toNum(coreRow.get('roots')), words: toNum(coreRow.get('words')), corpus: toNum(coreRow.get('corpus')) }
    : { roots: 0, words: 0, corpus: 0 };
  return { branches, coreStats };
}

// GET /analytics/projection?center_type=radical|biradical&center=<value>&projection=by_position|r3_completions[&corpus_id=][&surah=]
router.get('/analytics/projection', async (req, res) => {
  const { center_type, center, projection, corpus_id, surah } = req.query;

  if (!center_type || !center || !projection) {
    return res.status(400).json({ error: 'center_type, center, and projection are required' });
  }
  if (center_type === 'radical' && projection !== 'by_position') {
    return res.status(400).json({ error: "center_type=radical requires projection=by_position" });
  }
  if (center_type === 'biradical' && projection !== 'r3_completions') {
    return res.status(400).json({ error: "center_type=biradical requires projection=r3_completions" });
  }
  if (!['radical', 'biradical'].includes(center_type)) {
    return res.status(400).json({ error: 'center_type must be radical or biradical' });
  }

  let r1, r2;
  if (center_type === 'biradical') {
    const parts = center.split('-');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return res.status(400).json({ error: 'center must be in the form r1-r2 for center_type=biradical' });
    }
    [r1, r2] = parts;
  }

  try {
    const cacheKey = `${projection}:${center_type}:${center}:${corpus_id || 'all'}:${surah || ''}`;
    const { branches, coreStats } = await cached(cacheKey, async () => {
      if (center_type === 'radical') {
        return byPosition(req.driver, center, corpus_id, surah);
      }
      return r3Completions(req.driver, r1, r2, corpus_id, surah);
    });

    let scopeLabel = 'Entire lexicon';
    if (corpus_id) {
      scopeLabel = CORPUS_LABELS[Number(corpus_id)] || `Corpus ${corpus_id}`;
      if (surah) scopeLabel += ` — Surah ${surah}`;
    }

    res.json({
      center: { type: center_type, value: center, label: center },
      scope: {
        corpus_id: corpus_id ? Number(corpus_id) : null,
        surah:     surah ? Number(surah) : null,
        label:     scopeLabel,
      },
      projection,
      branches,
      core_stats: coreStats || null, // direct r3-less biliteral presence — r3_completions only
      meta: buildMeta(branches),
    });
  } catch (err) {
    console.error('[analytics/projection]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
