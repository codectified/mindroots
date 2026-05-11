# Observability & Notion Projection Layer

**Date Added**: May 2026  
**Status**: Backend complete — pending Notion credentials to activate projection  
**Files**: `routes/modules/observability.js`, `routes/api.js`, `.env`

---

## Overview

A semantic observability layer for MindRoots that exposes live graph health metrics from Neo4j and projects them into Notion as a human-facing dashboard.

**Design principles:**
- Neo4j is the sole source of truth — no canonical state lives in Notion
- Metrics are computed live on every request (no caching in V1)
- Notion is a projection/UI layer only — one fixed page per metric group, updated in-place
- No append-only snapshots, no historical telemetry stored in Notion
- Adding new metrics requires touching exactly one place: `METRIC_DEFINITIONS`

---

## Architecture

```
Neo4j ──► METRIC_DEFINITIONS ──► GET /observability/metrics  (JSON, no Notion)
                │
                └──► POST /projection/notion/refresh
                          │
                          ▼
                     upsert by metric_id (rich_text)
                          │
                     ┌────┴────┐
                     │  found  │ → PATCH existing page
                     │ missing │ → POST new page (bootstrap)
                     └─────────┘
                          │
                          ▼
                    Notion DB (projection only)
```

Each entry in `METRIC_DEFINITIONS` maps to exactly one Notion page. The page is identified by the stable `metric_id` rich_text property — not by title — so Notion labels can be renamed freely without causing duplicate pages.

---

## Endpoints

All endpoints require the standard `Authorization: Bearer <api-key>` header.

### `GET /api/observability/status`
Connectivity check. Returns Neo4j and Notion health without touching any data.

```json
{
  "neo4j": "ok",
  "notion": "ok",
  "notion_configured": true
}
```

Returns `503` if either service is unreachable.

### `GET /api/observability/metrics`
Runs all registered metric queries against Neo4j. Returns a live snapshot. No Notion interaction.

```json
{
  "ok": true,
  "snapshot": {
    "core_snapshot": {
      "metrics": { "total_roots": 1621, "total_words": 18432 },
      "quran": {
        "total_items": 6236,
        "linked_items": 5441,
        "unlinked_items": 795,
        "coverage_percent": 87.24
      },
      "linkage": {
        "total_corpus_word_links": 77430,
        "words_in_quran": 1683,
        "roots_in_quran": 412
      },
      "data_quality": { "orphan_words": 203 }
    }
  }
}
```

### `POST /api/projection/notion/refresh`
Runs all metric queries, then upserts each metric group's Notion page in-place.
- If the page exists (`metric_id` match): patches it with fresh values + `last_refreshed_at`
- If the page doesn't exist: creates it (first-run bootstrap)

```json
{
  "ok": true,
  "refreshed_at": "2026-05-11T14:32:00.000Z",
  "snapshot": { ... },
  "projections": [
    { "metric_id": "core_snapshot", "action": "updated", "page_id": "abc123..." }
  ]
}
```

---

## Metric Definitions Registry

Defined in `routes/modules/observability.js`, the `METRIC_DEFINITIONS` array is the single place to add, modify, or remove metric groups.

**Current groups:**

| id | label | Description |
|---|---|---|
| `core_snapshot` | Core Snapshot | Roots, words, Quran coverage, linkage, orphan data quality |

**Adding a new metric group:**

```js
{
  id: 'form_coverage',          // stable, used as Notion upsert key
  label: 'Form Coverage',       // human-readable, shown in Notion
  description: '...',
  params: {},                   // Cypher query parameters if needed
  query: `MATCH ...`,           // Cypher query
  transform(record) {           // extract + type-convert Neo4j result
    const r = deepConvertIntegers(record.get('result'));
    return { ... };
  },
  toNotionProps(data) {         // flat { column_name: number } for Notion
    return { ... };
  },
},
```

Then add the corresponding `Number` columns to the Notion database. The refresh endpoint auto-discovers and processes all definitions — no other code changes needed.

---

## Notion Database Setup

### Required columns

| Column | Type | Notes |
|---|---|---|
| `Name` | Title | Human-readable label — may be renamed freely |
| `metric_id` | Text (rich_text) | Stable internal ID — **do not edit after bootstrap** |
| `last_refreshed_at` | Date | Set on every refresh |
| `total_roots` | Number | |
| `total_words` | Number | |
| `quran_total` | Number | |
| `quran_linked` | Number | |
| `quran_unlinked` | Number | |
| `quran_coverage` | Number | Percent, rounded to 2 decimals |
| `total_corpus_word_links` | Number | |
| `words_in_quran` | Number | |
| `roots_in_quran` | Number | |
| `orphan_words` | Number | |

### Setup steps

1. Create a Notion integration at https://www.notion.so/my-integrations
   - Copy the `secret_...` token
2. Create a Notion database with the columns above
3. Share the database with your integration (via the database's "..." menu → Connections)
4. Copy the database ID from the database URL:
   `https://www.notion.so/{workspace}/{DATABASE_ID}?v=...`
5. Fill in `.env` on the server:
   ```
   NOTION_TOKEN=secret_...
   NOTION_DATABASE_ID=...
   ```
6. Restart the server (`pm2 restart all --update-env`)
7. Run the first refresh — this bootstraps the Notion pages:
   ```bash
   curl -X POST https://theoption.life/api/projection/notion/refresh \
     -H "Authorization: Bearer <api-key>"
   ```

---

## Current State (May 2026)

**Done:**
- `routes/modules/observability.js` written and registered in `routes/api.js`
- All three endpoints implemented and smoke-tested
- Upsert-by-`metric_id` logic in place (stable, title-independent)
- Core snapshot Cypher query covering roots, words, Quran coverage, linkage, data quality
- `.env` has placeholder slots for `NOTION_TOKEN` and `NOTION_DATABASE_ID`

**Pending:**
- Notion integration credentials — see setup steps above
- Notion database creation with the schema above
- First refresh call to bootstrap the projection page
- Server deployment (`rsync` + `pm2 restart`)

---

## Planned Future Metric Groups

Per the original architecture intent — all are additive (one new `METRIC_DEFINITIONS` entry each):

| Proposed id | Description |
|---|---|
| `form_coverage` | Word form linkage and morphological coverage |
| `ontology_coverage` | Ontological classification completeness |
| `graphrag_health` | Embedding coverage and retrieval readiness |
| `llm_orchestration` | LLM analysis node generation rates and gaps |

Project/task management projections (separate from metric groups) can be added as new endpoints under the `/projection/` namespace when needed.

---

## File Reference

| File | Purpose |
|---|---|
| `routes/modules/observability.js` | Metric registry, Neo4j queries, Notion upsert logic, all endpoints |
| `routes/api.js` | Module registration (`router.use('/', observabilityRoutes)`) |
| `.env` | `NOTION_TOKEN` and `NOTION_DATABASE_ID` slots (currently empty) |
| `DEPLOYMENT-PRIVATE.md` | SSH/rsync commands for pushing to production |
