# Surah Sub-Filter & Random Node Optimization — Feature Documentation

**Date Added**: April 5, 2026
**Status**: Production-Ready ✅
**Impact**: Quran surah-level filtering for search and Explore; O(1) random node selection replacing O(N log N) full-scan

---

## Overview

When the corpus filter is set to Quran (corpus_id = 2), a surah sub-filter becomes available allowing multi-select of individual surahs (1–114). All search endpoints and the Explore random node fetch respect this filter. When no surah is selected, all surahs are included.

Simultaneously, the random node selection algorithm in Explore was replaced: `ORDER BY rand()` (full scan + sort) was replaced with a count+skip approach using a module-level cache.

---

## Database Schema

CorpusItem nodes store surah membership as direct integer properties (not parsed from `item_id`):

```
(:CorpusItem {
  corpus_id: 2,
  surah_number: 69,    // integer
  ayah_number: 51,     // integer
  item_id: "69:51:3"   // still present but not parsed in queries
})
```

**Index**: Composite index on `(corpus_id, surah_number)` — enables fast scoped queries without full scan.

---

## Context API

**File**: `src/contexts/CorpusFilterContext.js`

```javascript
const { corpusFilter, setCorpusFilter, surahFilter, setSurahFilter } = useCorpusFilter();
// surahFilter: number[]  (empty = all surahs)
```

### Auto-reset behavior
`surahFilter` resets to `[]` automatically when `corpusFilter` changes to any non-Quran value. This prevents stale surah selections from silently applying when the user switches corpora.

---

## UI: SurahSelector

**File**: `src/components/selectors/SurahSelector.js`

- Renders **only** when `corpusFilter === 2` (Quran)
- Multi-select checkbox grid (2 columns, scrollable at max-height 160px)
- Each row: surah number + English name + Arabic name
- **All** button: clears selection (all surahs included)
- **Select All** button: selects all 114
- Count indicator shows how many surahs are selected

Rendered in:
- **Search page** — below the header row
- **Explore page** — below the header row

Surah data (number, arabic, english for all 114) is in `src/constants/surahs.js`.

---

## Cypher Filter Pattern

### Null-safe surah parameter

```javascript
// Backend: parse comma-separated string from query param
const surahNumbersParsed = surah_numbers
  ? surah_numbers.split(',').map(Number)
  : null;

// Pass null (not empty array) when no filter
queryParams.surahNumbers = surahNumbersParsed?.length > 0 ? surahNumbersParsed : null;
```

```cypher
// Cypher: null-safe OR short-circuits when no filter
AND ($surahNumbers IS NULL OR ci.surah_number IN $surahNumbers)
```

When `surahNumbers` is `null`, `$surahNumbers IS NULL` evaluates to `true` and the OR short-circuits — all surahs pass through without additional filtering.

---

## Backend: Search Endpoints

**File**: `routes/modules/search-modern.js`

All 4 search endpoints accept `surah_numbers` (comma-separated) via query params:

| Endpoint | Corpus gate location | Surah filter |
|---|---|---|
| `/search-roots` | `WITH root WHERE EXISTS {...}` | ✅ |
| `/search-combinate` | `WITH root WHERE EXISTS {...}` | ✅ |
| `/search-extended` | `WITH root WHERE EXISTS {...}` | ✅ |
| `/search-fulltext` | `MATCH (ci:CorpusItem)-[:HAS_WORD]->(word)` | ✅ |

Root search corpus+surah gate pattern:
```cypher
WITH root WHERE EXISTS {
  MATCH (root)-[:HAS_WORD]->(:Word)<-[:HAS_WORD]-(ci:CorpusItem)
  WHERE ci.corpus_id = toInteger($corpusId)
    AND ($surahNumbers IS NULL OR ci.surah_number IN $surahNumbers)
}
```

Full text search corpus+surah gate pattern:
```cypher
MATCH (ci:CorpusItem)-[:HAS_WORD]->(word)
WHERE ci.corpus_id = toInteger($corpusId)
  AND ($surahNumbers IS NULL OR ci.surah_number IN $surahNumbers)
```

---

## Backend: Random Node Optimization

**File**: `routes/modules/graph.js`

### Problem
`ORDER BY rand()` requires a full scan of all matching nodes followed by a sort — O(N log N). For Quran with ~77,000 CorpusItems this was expensive and got worse with corpus/surah filtering.

### Solution: Count + Skip

```javascript
// 1. Count matching nodes (cached)
const total = await getCachedCount(cacheKey, session, countQuery, params);

// 2. Pick a random offset
const skip = Math.floor(Math.random() * total);

// 3. Fetch one node at that offset
const result = await session.run(
  `${matchClause} WHERE ${whereClause} RETURN n SKIP ${skip} LIMIT 1`,
  params
);
```

SKIP is embedded in the query string (not parameterized) because Neo4j SKIP does not support parameters in older versions.

### Count Cache

Module-level `Map` keyed by a canonical stringification of all filter parameters:

```javascript
const randomNodeCountCache = new Map();

const makeCacheKey = (obj) => {
  const normalized = {};
  for (const [k, v] of Object.entries(obj)) {
    normalized[k] = Array.isArray(v) ? [...v].sort() : (v ?? null);
  }
  return JSON.stringify(normalized);
};

const getCachedCount = async (cacheKey, session, countQuery, params) => {
  if (randomNodeCountCache.has(cacheKey)) {
    return randomNodeCountCache.get(cacheKey);
  }
  const result = await session.run(countQuery, params);
  const count = result.records[0]?.get('total')?.toNumber() ?? 0;
  randomNodeCountCache.set(cacheKey, count);
  return count;
};
```

Cache is invalidated on server restart. Since node counts change rarely in production, this is acceptable.

### Corpus+Surah EXISTS pattern (per node type)

Word:
```cypher
EXISTS {
  MATCH (ci:CorpusItem)-[:HAS_WORD]->(n)
  WHERE ci.corpus_id = $corpusId
    AND ($surahNumbers IS NULL OR ci.surah_number IN $surahNumbers)
}
```

Root:
```cypher
EXISTS {
  MATCH (ci:CorpusItem)-[:HAS_WORD]->(:Word)<-[:HAS_WORD]-(r)
  WHERE ci.corpus_id = $corpusId
    AND ($surahNumbers IS NULL OR ci.surah_number IN $surahNumbers)
}
```

Form:
```cypher
EXISTS {
  MATCH (ci:CorpusItem)-[:HAS_WORD]->(:Word)-[:HAS_FORM]->(f)
  WHERE ci.corpus_id = $corpusId
    AND ($surahNumbers IS NULL OR ci.surah_number IN $surahNumbers)
}
```

`EXISTS {}` is a semi-join: it short-circuits on the first match, avoiding DISTINCT and full traversal.

---

## Frontend: API Service

**File**: `src/services/apiService.js`

`surah_numbers` (array of ints) is accepted by all 5 relevant functions and serialized as a comma-separated query param:

```javascript
if (surah_numbers && surah_numbers.length > 0) {
  params.surah_numbers = surah_numbers.join(',');
}
```

Functions updated: `fetchRoots`, `fetchCombinateRoots`, `fetchExtendedRootsNew`, `searchFullText`, `fetchRandomNodes`

---

## Architecture Summary

```
CorpusFilterContext
  surahFilter: number[]  ([] = all surahs)
  auto-resets to [] when corpus changes away from Quran
       ↓
SurahSelector (visible only when corpusFilter === 2)
  rendered in Search.js and Explore.js
       ↓
  ┌─────────────────────────────────────────────────────────┐
  │ Search.js      surahNumbers → all 4 search endpoints   │
  │ Explore.js     surah_numbers → fetchRandomNodes         │
  └─────────────────────────────────────────────────────────┘
       ↓
Backend (search-modern.js, graph.js)
  $surahNumbers IS NULL OR ci.surah_number IN $surahNumbers
  EXISTS {} semi-join; count+skip random selection
```

---

## Known Constraints

- **Cache invalidation**: Count cache is process-scoped and cleared only on server restart. If nodes are added/removed during a session, cached counts may be slightly off. This is acceptable in production since corpus data is stable.
- **SKIP embedding**: Random node SKIP offset is embedded in query string rather than parameterized. This is a Neo4j limitation (older versions don't support parameterized SKIP).
- **Surah filter scope**: Applies only to search retrieval and Explore random fetch — NOT to node expansion (always lexical). See [Corpus Filter Documentation](CORPUS-FILTER-DOCUMENTATION.md).

---

**Last Updated**: April 5, 2026
**Files**: `src/contexts/CorpusFilterContext.js`, `src/components/selectors/SurahSelector.js`, `src/constants/surahs.js`, `routes/modules/graph.js`, `routes/modules/search-modern.js`, `src/services/apiService.js`, `src/components/graph/Search.js`, `src/components/graph/Explore.js`
**See Also**: [Corpus Filter Documentation](CORPUS-FILTER-DOCUMENTATION.md)
