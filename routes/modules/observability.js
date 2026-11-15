/**
 * Observability Module — Neo4j semantic metrics + universe graph snapshot
 *
 * Endpoints:
 *   GET  /observability/metrics        JSON snapshot of graph metrics
 *                                      (cached in memory for 10 minutes)
 *   GET  /observability/status         Neo4j connectivity check
 *   GET  /universe/graph               full node+link snapshot for 3D universe visualization
 *                                      (cached in memory for 1 hour — first call is slow)
 *
 * The Notion projection (POST /projection/notion/refresh) was removed on
 * 2026-11-14: Notion is no longer used, and the endpoint was open to the
 * public key.
 *
 * Adding new metric groups: add an entry to METRIC_DEFINITIONS (query, transform).
 */

const express = require('express');
const neo4j = require('neo4j-driver');
const router = express.Router();

// ====================================================================
// UNIVERSE GRAPH CACHE
// Holds the full node/link snapshot for the /universe/graph endpoint.
// Built once on first request, refreshed every hour.
// ====================================================================
let universeGraphCache = null;
let universeGraphCachedAt = 0;
const UNIVERSE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

let metricsCache = null;
let metricsCachedAt = 0;
const METRICS_CACHE_TTL = 10 * 60 * 1000; // the queries scan the whole graph

// ====================================================================
// METRIC DEFINITIONS
// Add new metric groups here. Each entry is independently queryable.
// ====================================================================

const METRIC_DEFINITIONS = [
  {
    id: 'core_snapshot',
    label: 'Core Snapshot',
    description: 'Core graph stats, Quran coverage, linkage, and data quality',
    params: {},
    query: `
      CALL {
        MATCH (r:Root)
        RETURN count(r) AS total_roots
      }
      CALL {
        MATCH (w:Word)
        RETURN count(w) AS total_words
      }
      CALL {
        MATCH (:CorpusItem)-[rel:HAS_WORD]->(:Word)
        RETURN count(rel) AS total_corpus_word_links
      }
      CALL {
        MATCH (c:CorpusItem {corpus_id: 2})
        WITH count(c) AS total
        MATCH (c2:CorpusItem {corpus_id: 2})-[:HAS_WORD]->(:Word)
        WITH total, count(DISTINCT c2) AS linked
        RETURN
          total AS quran_total,
          linked AS quran_linked,
          total - linked AS quran_unlinked,
          (toFloat(linked)/total)*100 AS quran_coverage
      }
      CALL {
        MATCH (w:Word)<-[:HAS_WORD]-(:CorpusItem {corpus_id: 2})
        RETURN count(DISTINCT w) AS words_in_quran
      }
      CALL {
        MATCH (r:Root)-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(:CorpusItem {corpus_id: 2})
        RETURN count(DISTINCT r) AS roots_in_quran
      }
      CALL {
        MATCH (w:Word)
        WHERE NOT (w)<-[:HAS_WORD]-(:CorpusItem)
        RETURN count(w) AS orphan_words
      }
      RETURN {
        metrics: {
          total_roots: total_roots,
          total_words: total_words
        },
        quran: {
          total_items: quran_total,
          linked_items: quran_linked,
          unlinked_items: quran_unlinked,
          coverage_percent: quran_coverage
        },
        linkage: {
          total_corpus_word_links: total_corpus_word_links,
          words_in_quran: words_in_quran,
          roots_in_quran: roots_in_quran
        },
        data_quality: {
          orphan_words: orphan_words
        }
      } AS result
    `,

    transform(record) {
      const r = deepConvertIntegers(record.get('result'));
      return {
        metrics:      r.metrics,
        quran:        r.quran,
        linkage:      r.linkage,
        data_quality: r.data_quality,
      };
    },

  },

  {
    id: 'node_counts',
    label: 'Node Counts',
    description: 'Raw count of each semantic node type in the graph',
    params: {},
    query: `
      CALL { MATCH (n:Root)           RETURN count(n) AS roots }
      CALL { MATCH (n:Word)           RETURN count(n) AS words }
      CALL { MATCH (n:CorpusItem)     RETURN count(n) AS corpus_items }
      CALL { MATCH (n:RadicalPosition) RETURN count(n) AS radical_positions }
      CALL { MATCH (n:Form)           RETURN count(n) AS forms }
      CALL { MATCH (n:Analysis)       RETURN count(n) AS analyses }
      CALL { MATCH (n:Article)        RETURN count(n) AS articles }
      RETURN {
        roots: roots, words: words, corpus_items: corpus_items,
        radical_positions: radical_positions, forms: forms,
        analyses: analyses, articles: articles
      } AS result
    `,
    transform(record) {
      return deepConvertIntegers(record.get('result'));
    },
  },

  // ── future metric groups ─────────────────────────────────────────────────
  // {
  //   id: 'graphrag_health',
  //   label: 'GraphRAG Health',
  //   description: 'Embedding coverage and retrieval readiness metrics',
  //   ...
  // },
];

// ====================================================================
// UTILITIES
// ====================================================================

function deepConvertIntegers(obj) {
  if (obj === null || obj === undefined) return obj;
  if (neo4j.isInt(obj)) return obj.toNumber();
  if (typeof obj === 'object' && 'low' in obj && 'high' in obj) {
    return neo4j.int(obj.low, obj.high).toNumber();
  }
  if (typeof obj === 'number') return obj;
  if (Array.isArray(obj)) return obj.map(deepConvertIntegers);
  if (typeof obj === 'object') {
    const out = {};
    for (const key of Object.keys(obj)) out[key] = deepConvertIntegers(obj[key]);
    return out;
  }
  return obj;
}

async function runAllMetrics(driver) {
  const session = driver.session();
  const results = {};

  try {
    for (const def of METRIC_DEFINITIONS) {
      const result = await session.run(def.query, def.params);
      if (result.records.length > 0) {
        results[def.id] = def.transform(result.records[0]);
      }
    }
  } finally {
    await session.close();
  }

  return results;
}

// ====================================================================
// ENDPOINTS
// ====================================================================

// GET /observability/status — connectivity check, no side effects
router.get('/observability/status', async (req, res) => {
  const session = req.driver.session();
  try {
    await session.run('RETURN 1');
    res.json({ neo4j: 'ok' });
  } catch (err) {
    console.error('[observability] status error:', err.message);
    res.status(503).json({ neo4j: 'error' });
  } finally {
    await session.close();
  }
});

// GET /observability/metrics — snapshot, cached for METRICS_CACHE_TTL
router.get('/observability/metrics', async (req, res) => {
  try {
    if (!metricsCache || Date.now() - metricsCachedAt > METRICS_CACHE_TTL) {
      metricsCache = await runAllMetrics(req.driver);
      metricsCachedAt = Date.now();
    }
    res.json({ ok: true, snapshot: metricsCache });
  } catch (err) {
    console.error('[observability] metrics error:', err.message);
    res.status(500).json({ ok: false, error: 'Error computing metrics' });
  }
});

// ====================================================================
// UNIVERSE GRAPH ENDPOINT
// Returns all nodes (Root, Word, Form, Ayah) + Root→Word links for
// the 3D universe visualization. Cached in memory for 1 hour so the
// full-DB traversal only runs once per server process.
// ====================================================================

router.get('/universe/graph', async (req, res) => {
  const now = Date.now();
  if (universeGraphCache && (now - universeGraphCachedAt) < UNIVERSE_CACHE_TTL) {
    return res.json({ ...universeGraphCache, cached: true });
  }

  const session = req.driver.session();
  try {
    const nodes = [];
    const links = [];

    // Roots
    const rootsRes = await session.run(
      `MATCH (r:Root)
       RETURN toInteger(r.root_id) AS id, coalesce(r.arabic, r.english, '') AS label`
    );
    rootsRes.records.forEach(rec => {
      nodes.push({ id: `r_${deepConvertIntegers(rec.get('id'))}`, type: 'root', label: rec.get('label') || '' });
    });

    // Words — dataSize is stored on the node (corpus frequency proxy)
    const wordsRes = await session.run(
      `MATCH (w:Word)
       RETURN toInteger(w.word_id) AS id,
              coalesce(w.arabic, w.english, '') AS label,
              coalesce(w.dataSize, 1) AS dataSize`
    );
    wordsRes.records.forEach(rec => {
      nodes.push({
        id:       `w_${deepConvertIntegers(rec.get('id'))}`,
        type:     'word',
        label:    rec.get('label') || '',
        dataSize: deepConvertIntegers(rec.get('dataSize')),
      });
    });

    // Ayahs — scripture layer, displayed in corpus-item gold
    const ayahsRes = await session.run(
      `MATCH (a:Ayah) RETURN a.ayah_key AS id`
    );
    ayahsRes.records.forEach(rec => {
      const id = rec.get('id');
      nodes.push({ id: `a_${id}`, type: 'corpusitem', label: id || '' });
    });

    // Forms — morphological variants; query guarded so missing label is fine
    try {
      const formsRes = await session.run(
        `MATCH (f:Form)
         RETURN toInteger(f.form_id) AS id, coalesce(f.arabic, '') AS label
         LIMIT 10000`
      );
      formsRes.records.forEach(rec => {
        nodes.push({ id: `f_${deepConvertIntegers(rec.get('id'))}`, type: 'form', label: rec.get('label') || '' });
      });
    } catch (formErr) {
      console.warn('[universe] forms query skipped:', formErr.message);
    }

    // Root → Word structural links
    const linksRes = await session.run(
      `MATCH (r:Root)-[:HAS_WORD]->(w:Word)
       RETURN toInteger(r.root_id) AS src, toInteger(w.word_id) AS tgt`
    );
    linksRes.records.forEach(rec => {
      links.push({
        source: `r_${deepConvertIntegers(rec.get('src'))}`,
        target: `w_${deepConvertIntegers(rec.get('tgt'))}`,
      });
    });

    universeGraphCache = { nodes, links, computed_at: new Date().toISOString() };
    universeGraphCachedAt = now;
    console.log(`[universe] graph computed: ${nodes.length} nodes, ${links.length} links`);

    res.json({ ...universeGraphCache, cached: false });
  } catch (err) {
    console.error('[universe] graph error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
