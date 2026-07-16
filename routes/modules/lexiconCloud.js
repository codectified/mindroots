const express = require('express');
const fs   = require('fs');
const path = require('path');
const { UMAP } = require('umap-js');
const { toNum } = require('./lib/numeric');
const phon = require('./lib/phonology');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Lexicon Morphology Landscape — a stable, whole-lexicon 2D point map.
//
//   radical → bi-radical family → triliteral root → lexical word
//
// The base map is lexicon-wide and deterministic, so it is computed once and
// persisted to disk. Corpus filters / radical selection are client-side
// highlight overlays on this fixed geometry — they never trigger a rebuild.
//
// Layout is parent-anchored (NOT a naive mixed-entity UMAP):
//   • family centers come from a UMAP over family-level feature vectors
//   • a family's roots are placed by phyllotaxis around its center,
//     region radius ∝ family breadth (root count)
//   • a root's words are placed by phyllotaxis around the root,
//     cloud radius ∝ root depth (word count)  → deep roots get large halos
//   • marker size: family ∝ breadth, root ∝ depth, word = small fixed
//
// Payload is columnar (parallel arrays, keys written once) to stay compact at
// ~60k points. Point index is identity; `labels[i]` gives the Arabic string for
// hover; `lookup[i]` carries extra metrics for structural (family/root) points.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_FILE = path.join(__dirname, 'lexicon-cloud-cache.json');
const SCHEMA_VERSION = 2; // bump to invalidate the on-disk artifact

// Layout constants (world units).
const MAP_EXTENT      = 4000; // family centers scaled to roughly [-2000, 2000]
const GOLDEN_ANGLE    = Math.PI * (3 - Math.sqrt(5));
const FAMILY_SPREAD   = 9;    // root-region radius = FAMILY_SPREAD * sqrt(breadth)
const WORD_SPREAD     = 1.3;  // word-cloud radius   = WORD_SPREAD   * sqrt(depth)
const ROOT_MIN_SIZE   = 2;
const FAMILY_MIN_SIZE = 3;
const WORD_SIZE       = 1.1;

// point levels
const L_FAMILY = 0, L_ROOT = 1, L_WORD = 2;

let memo = null;
function loadCache() {
  if (memo) return memo;
  try {
    const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (parsed && parsed.schema === SCHEMA_VERSION) memo = parsed;
  } catch (_) { /* no cache yet */ }
  return memo;
}
function saveCache(data) {
  memo = data;
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(data)); } catch (_) { /* best effort */ }
}

// ── small numeric helpers ────────────────────────────────────────────────────
const log1p = (x) => Math.log(1 + Math.max(0, x));
const r1p = (x) => Math.round(x * 10) / 10; // one-decimal rounding

// Seeded PRNG (mulberry32) so the UMAP layout is reproducible across rebuilds —
// the base map must be stable, not reshuffle every time it is regenerated.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const UMAP_SEED = 1618033;

// z-score each column of a matrix in place across rows
function zscoreColumns(rows) {
  if (rows.length === 0) return;
  const dims = rows[0].length;
  for (let d = 0; d < dims; d++) {
    let mean = 0;
    for (const r of rows) mean += r[d];
    mean /= rows.length;
    let variance = 0;
    for (const r of rows) variance += (r[d] - mean) ** 2;
    const std = Math.sqrt(variance / rows.length) || 1;
    for (const r of rows) r[d] = (r[d] - mean) / std;
  }
}

// scale a set of [x,y] points to fit within ±extent/2, centered on origin
function fitToExtent(pts, extent) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const span = Math.max(maxX - minX || 1, maxY - minY || 1);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  return pts.map(([x, y]) => [((x - cx) / span) * extent, ((y - cy) / span) * extent]);
}

// corpus_id list → bitmask (bit0=corpus1 Poetry, bit1=corpus2 Qur'an, bit2=corpus3 Prose)
function corpusMask(ids) {
  let m = 0;
  for (const id of ids) {
    const n = toNum(id);
    if (n >= 1 && n <= 8) m |= (1 << (n - 1));
  }
  return m;
}

// ── data pipeline ────────────────────────────────────────────────────────────
async function buildLexiconCloud(driver) {
  const session = driver.session();
  try {
    // Query A: every triliteral root with its family (r1,r2) and depth (word count).
    const rootRes = await session.run(`
      MATCH (r:Root)
      WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL AND r.r3 IS NOT NULL
      OPTIONAL MATCH (r)-[:HAS_WORD]->(w:Word)
      WITH r, count(DISTINCT w) AS depth
      RETURN id(r) AS rid, r.r1 AS r1, r.r2 AS r2, r.r3 AS r3,
             r.arabic AS arabic, r.english AS english,
             coalesce(r.feature_corpus_count, 0) AS corpus, depth
      ORDER BY r1, r2, r3
    `);

    // Query B: words per triliteral root, with their attesting corpus ids.
    const wordRes = await session.run(`
      MATCH (r:Root)-[:HAS_WORD]->(w:Word)
      WHERE r.r1 IS NOT NULL AND r.r2 IS NOT NULL AND r.r3 IS NOT NULL
      OPTIONAL MATCH (ci:CorpusItem)-[:HAS_WORD]->(w)
      WITH id(r) AS rid, w, collect(DISTINCT ci.corpus_id) AS corpora
      RETURN rid, w.arabic AS arabic, corpora
    `);

    // Enrichment: form diversity per family (optional; defaults to 0).
    const formRes = await session.run(`
      MATCH (b:BiRadicalCluster)
      RETURN b.pair_key AS pair, coalesce(b.avg_forms, 0) AS forms
    `);
    const formsByPair = new Map();
    formRes.records.forEach(r => formsByPair.set(r.get('pair'), toNum(r.get('forms'))));

    // Words grouped by parent root id.
    const wordsByRid = new Map();
    wordRes.records.forEach(rec => {
      const rid = toNum(rec.get('rid'));
      const list = wordsByRid.get(rid) || (wordsByRid.set(rid, []), wordsByRid.get(rid));
      list.push({ arabic: rec.get('arabic') || '', mask: corpusMask(rec.get('corpora') || []) });
    });

    // Group roots into families keyed by "r1-r2".
    const families = new Map();
    rootRes.records.forEach(rec => {
      const r1 = rec.get('r1'), r2 = rec.get('r2');
      const pair = `${r1}-${r2}`;
      const root = {
        rid: toNum(rec.get('rid')), r3: rec.get('r3'),
        arabic: rec.get('arabic'), english: rec.get('english'),
        depth: toNum(rec.get('depth')), corpus: toNum(rec.get('corpus')),
      };
      let fam = families.get(pair);
      if (!fam) { fam = { pair, r1, r2, roots: [], breadth: 0, words: 0, corpus: 0 }; families.set(pair, fam); }
      fam.roots.push(root);
      fam.breadth += 1;
      fam.words   += root.depth;
      fam.corpus  += root.corpus;
    });
    const famList = Array.from(families.values());

    // Family feature vectors → z-score continuous dims → append weighted class one-hots.
    const contRows = famList.map(f => [log1p(f.breadth), log1p(f.words), log1p(f.corpus), formsByPair.get(f.pair) || 0]);
    zscoreColumns(contRows);
    const vectors = famList.map((f, i) => {
      const oneHot = [...phon.classOneHot(f.r1), ...phon.classOneHot(f.r2)].map(v => v * 1.2);
      return [...contRows[i], ...oneHot];
    });

    // Family centers via UMAP over feature vectors.
    let centers;
    if (famList.length <= 2) {
      centers = famList.map((_, i) => [i * 100, 0]);
    } else {
      const umap = new UMAP({ nComponents: 2, nNeighbors: Math.min(15, famList.length - 1), minDist: 0.1, random: mulberry32(UMAP_SEED) });
      centers = umap.fit(vectors);
    }
    centers = fitToExtent(centers, MAP_EXTENT);

    // ── assemble columnar arrays: families → each root → that root's words ──────
    const level = [], X = [], Y = [], cls = [], size = [], W = [], corpora = [], fam = [], labels = [];
    const lookup = {}; // extra metrics for structural points only (family/root)
    let i = 0;

    famList.forEach((f, fi) => {
      const [fx, fy] = centers[fi];
      const fcls = phon.classIndex(f.r1);

      const famPos = i; // backpatch corpora once its descendants' masks are known
      level.push(L_FAMILY); X.push(r1p(fx)); Y.push(r1p(fy)); cls.push(fcls);
      size.push(r1p(FAMILY_MIN_SIZE + Math.sqrt(f.breadth) * 1.6)); W.push(f.breadth);
      corpora.push(0); fam.push(fi); labels.push(f.pair);
      lookup[i] = { kind: 'family', breadth: f.breadth, words: f.words, corpus: f.corpus };
      i++;
      let famMask = 0;

      const n = f.roots.length;
      const regionR = FAMILY_SPREAD * Math.sqrt(f.breadth);
      f.roots.forEach((root, ri) => {
        const rr = n > 1 ? regionR * Math.sqrt(ri / n) : 0;
        const a = ri * GOLDEN_ANGLE;
        const rx = fx + rr * Math.cos(a);
        const ry = fy + rr * Math.sin(a);

        // Words: phyllotaxis cloud around the root, radius ∝ depth; also OR up masks.
        const words = wordsByRid.get(root.rid) || [];
        const m = words.length;
        const cloudR = WORD_SPREAD * Math.sqrt(m);
        let rootMask = 0;
        words.forEach(w => { rootMask |= w.mask; });

        level.push(L_ROOT); X.push(r1p(rx)); Y.push(r1p(ry)); cls.push(fcls);
        size.push(r1p(ROOT_MIN_SIZE + Math.sqrt(root.depth) * 1.2)); W.push(root.depth);
        corpora.push(rootMask); fam.push(fi);
        labels.push(root.arabic || [f.r1, f.r2, root.r3].filter(Boolean).join('-'));
        lookup[i] = { kind: 'root', english: root.english || null, depth: root.depth, corpus: root.corpus };
        i++;
        famMask |= rootMask;

        words.forEach((word, wi) => {
          const wr = m > 1 ? cloudR * Math.sqrt(wi / m) : 0;
          const wa = wi * GOLDEN_ANGLE;
          level.push(L_WORD); X.push(r1p(rx + wr * Math.cos(wa))); Y.push(r1p(ry + wr * Math.sin(wa)));
          cls.push(fcls); size.push(WORD_SIZE); W.push(0);
          corpora.push(word.mask); fam.push(fi); labels.push(word.arabic);
          i++;
        });
      });
      corpora[famPos] = famMask;
    });

    return {
      schema: SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      legend: phon.CLASS_LEGEND,
      map_extent: MAP_EXTENT,
      corpus_labels: { 1: 'Poetry', 2: "Qur'an", 3: 'Prose' },
      counts: {
        families: famList.length,
        roots: level.filter(l => l === L_ROOT).length,
        words: level.filter(l => l === L_WORD).length,
      },
      n: level.length,
      level, x: X, y: Y, cls, size, w: W, corpora, fam, labels, lookup,
    };
  } finally {
    await session.close();
  }
}

// GET /api/analytics/lexicon-cloud[?rebuild=1]
router.get('/analytics/lexicon-cloud', async (req, res) => {
  try {
    const rebuild = req.query.rebuild === '1';
    let data = rebuild ? null : loadCache();
    if (!data) {
      data = await buildLexiconCloud(req.driver);
      saveCache(data);
    }
    res.json(data);
  } catch (err) {
    console.error('[lexicon-cloud]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
