/**
 * Observability Module — Neo4j semantic metrics + Notion projection layer
 *
 * Neo4j is the sole source of truth.
 * Notion is a human-facing projection layer only — not a data store.
 *
 * Endpoints:
 *   GET  /observability/metrics        live JSON snapshot from Neo4j (no Notion write)
 *   GET  /observability/status         Neo4j + Notion connectivity check
 *   POST /projection/notion/refresh    update existing Notion pages in-place (upsert by label)
 *
 * Notion behavior:
 *   Each metric group maps to one fixed Notion page identified by its label.
 *   On refresh: patch existing page. On first run: create it (bootstrap).
 *   No append-only rows. No historical snapshots. Notion never stores canonical state.
 *
 * Adding new metric groups:
 *   1. Add entry to METRIC_DEFINITIONS (query, transform, toNotionProps)
 *   2. Add corresponding Number columns to the Notion database
 *   That's it — the runner and projection layer handle the rest automatically.
 *
 * Future projection targets (add alongside Notion when needed):
 *   /projection/sheets/refresh, /projection/dashboard/refresh, etc.
 *
 * Required env vars:
 *   NOTION_TOKEN          Notion integration token (secret_...)
 *   NOTION_DATABASE_ID    Target Notion database ID
 *
 * Expected Notion database columns:
 *   Name               (title)      — human-readable label, may change freely
 *   metric_id          (rich_text)  — stable internal ID, used for upsert targeting
 *   last_refreshed_at  (date)
 *   total_roots        (number)
 *   total_words        (number)
 *   quran_total        (number)
 *   quran_linked       (number)
 *   quran_unlinked     (number)
 *   quran_coverage     (number)     — percent rounded to 2 decimals
 *   total_corpus_word_links (number)
 *   words_in_quran     (number)
 *   roots_in_quran     (number)
 *   orphan_words       (number)
 */

const express = require('express');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const router = express.Router();

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// ====================================================================
// METRIC DEFINITIONS
// Add new metric groups here. Each entry is independently queryable.
// ====================================================================

const METRIC_DEFINITIONS = [
  {
    id: 'core_snapshot',
    label: 'Core Snapshot',        // Notion page title — stable identifier, do not change after bootstrap
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

    // Returns flat { column_name: number } for Notion property mapping.
    // Keys must match Notion database column names exactly.
    toNotionProps(data) {
      return {
        total_roots:             data.metrics?.total_roots,
        total_words:             data.metrics?.total_words,
        quran_total:             data.quran?.total_items,
        quran_linked:            data.quran?.linked_items,
        quran_unlinked:          data.quran?.unlinked_items,
        quran_coverage:          round2(data.quran?.coverage_percent),
        total_corpus_word_links: data.linkage?.total_corpus_word_links,
        words_in_quran:          data.linkage?.words_in_quran,
        roots_in_quran:          data.linkage?.roots_in_quran,
        orphan_words:            data.data_quality?.orphan_words,
      };
    },
  },

  // ── future metric groups ─────────────────────────────────────────────────
  // {
  //   id: 'form_coverage',
  //   label: 'Form Coverage',
  //   description: 'Word form linkage and morphological coverage',
  //   params: {},
  //   query: `...`,
  //   transform(record) { ... },
  //   toNotionProps(data) { ... },
  // },
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

function round2(val) {
  return val != null ? Math.round(val * 100) / 100 : null;
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
// NOTION PROJECTION
// ====================================================================

function notionHeaders() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN is not configured');
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

// Builds Notion API property objects from a flat { key: number } map.
// metric_id is written as rich_text and is the stable upsert key — never changes.
// Name/label is human-facing and may be updated freely without breaking upserts.
// Extend this function if future metric groups need non-number property types.
function buildNotionProperties(id, label, flatProps, refreshedAt) {
  const props = {
    Name:              { title: [{ text: { content: label } }] },
    metric_id:         { rich_text: [{ text: { content: id } }] },
    last_refreshed_at: { date: { start: refreshedAt } },
  };
  for (const [key, val] of Object.entries(flatProps)) {
    if (val != null) props[key] = { number: Number(val) };
  }
  return props;
}

// Upsert: finds the page by stable metric_id (rich_text), patches it.
// If not found, creates it — transparent first-run bootstrap.
// Searching by metric_id means label/Name changes never cause duplicate pages.
async function upsertNotionPage(dbId, def, data, refreshedAt) {
  const headers = notionHeaders();
  const properties = buildNotionProperties(
    def.id,
    def.label,
    def.toNotionProps(data),
    refreshedAt
  );

  const searchRes = await axios.post(
    `${NOTION_API}/databases/${dbId}/query`,
    {
      filter: { property: 'metric_id', rich_text: { equals: def.id } },
      page_size: 1,
    },
    { headers }
  );

  const existing = searchRes.data.results?.[0];

  if (existing) {
    await axios.patch(
      `${NOTION_API}/pages/${existing.id}`,
      { properties },
      { headers }
    );
    return { action: 'updated', page_id: existing.id };
  }

  const created = await axios.post(
    `${NOTION_API}/pages`,
    { parent: { database_id: dbId }, properties },
    { headers }
  );
  return { action: 'created', page_id: created.data.id };
}

// ====================================================================
// ENDPOINTS
// ====================================================================

// GET /observability/status — connectivity check, no side effects
router.get('/observability/status', async (req, res) => {
  const status = {
    neo4j:              'unchecked',
    notion:             'unchecked',
    notion_configured:  !!(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID),
  };

  try {
    const session = req.driver.session();
    await session.run('RETURN 1');
    await session.close();
    status.neo4j = 'ok';
  } catch (err) {
    status.neo4j = `error: ${err.message}`;
  }

  if (status.notion_configured) {
    try {
      await axios.get(
        `${NOTION_API}/databases/${process.env.NOTION_DATABASE_ID}`,
        { headers: notionHeaders() }
      );
      status.notion = 'ok';
    } catch (err) {
      status.notion = `error: ${err.response?.data?.message || err.message}`;
    }
  } else {
    status.notion = 'not_configured';
  }

  const allOk = status.neo4j === 'ok' &&
    (status.notion === 'ok' || status.notion === 'not_configured');
  res.status(allOk ? 200 : 503).json(status);
});

// GET /observability/metrics — live snapshot, no Notion interaction
router.get('/observability/metrics', async (req, res) => {
  try {
    const snapshot = await runAllMetrics(req.driver);
    res.json({ ok: true, snapshot });
  } catch (err) {
    console.error('[observability] metrics error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /projection/notion/refresh
// Runs live metrics and updates each metric group's Notion page in-place.
// Creates the page on first run (bootstrap). Never appends new rows.
router.post('/projection/notion/refresh', async (req, res) => {
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!dbId) {
    return res.status(503).json({ ok: false, error: 'NOTION_DATABASE_ID is not configured' });
  }
  if (!process.env.NOTION_TOKEN) {
    return res.status(503).json({ ok: false, error: 'NOTION_TOKEN is not configured' });
  }

  try {
    const refreshedAt = new Date().toISOString();
    const snapshot = await runAllMetrics(req.driver);

    const projections = [];
    for (const def of METRIC_DEFINITIONS) {
      const data = snapshot[def.id];
      if (!data) continue;
      const result = await upsertNotionPage(dbId, def, data, refreshedAt);
      projections.push({ metric_id: def.id, ...result });
    }

    console.log(`[projection] Notion refreshed at ${refreshedAt}:`, projections);
    res.json({ ok: true, refreshed_at: refreshedAt, snapshot, projections });
  } catch (err) {
    console.error('[projection] Notion refresh error:', err.message);
    const notionErr = err.response?.data;
    res.status(notionErr ? 502 : 500).json({
      ok: false,
      error: err.message,
      ...(notionErr && { notion_error: notionErr }),
    });
  }
});

module.exports = router;
