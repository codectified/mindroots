# Corpus Count Annotation — Feature Documentation

**Date Added**: April 7, 2026
**Status**: Production-Ready ✅
**Impact**: Root and word nodes are annotated with occurrence counts in the active corpus/surah filter, surfaced in the NodesTable Location column

---

## Overview

When a corpus filter is active, nodes returned by Explore random fetch, Explore root expansion, and all Search root queries are annotated with `corpus_count` — the number of CorpusItem occurrences for that node within the current corpus/surah scope.

This count is display-only. It does **not** change which nodes are returned. Expansion is always lexical; counts are a separate annotation pass.

---

## Where Counts Appear

| Screen | Node type | Source |
|---|---|---|
| Explore (table mode) | Root | Random-nodes endpoint, inline OPTIONAL MATCH |
| Explore (table mode) | Word (after root expand) | Expand endpoint, OPTIONAL MATCH per word |
| Search (table mode) | Root | Batch count query after main search |
| Search (table mode) | Word (after root expand) | Same expand endpoint as Explore |

Counts are shown in the **Location column** of `NodesTable`:
- Root: `"10 items"` / `"1 item"`
- Word: `"3 items"` / `"0 items"`
- CorpusItem: `surah:ayah:word_position` (unchanged)

The Location column appears only when at least one node has a corpus location or count.

---

## Backend Implementation

### 1. Explore — Random Root Fetch (`routes/modules/graph.js`)

When `nodeType === 'root'` and `corpusId` is set, the fetch query uses `WITH ... SKIP ... LIMIT 1` to select one root, then appends an `OPTIONAL MATCH` count:

```cypher
MATCH (r:Root)
WHERE [filter conditions]
WITH r SKIP ${skip} LIMIT 1
OPTIONAL MATCH (ci:CorpusItem)-[:HAS_WORD]->(:Word)<-[:HAS_WORD]-(r)
WHERE ci.corpus_id = $corpusId
  AND ($surahNumbers IS NULL OR ci.surah_number IN $surahNumbers)
RETURN r, count(ci) AS corpus_count
```

`corpus_count` is extracted via `record.get('corpus_count').toNumber()` and attached to the serialized node.

### 2. Explore/Search — Root→Word Expansion (`routes/modules/graph.js`)

When the expand endpoint receives `count_corpus_id` (and optionally `count_surah_numbers`), the root→word query is augmented:

```cypher
MATCH (root:Root {root_id: toInteger($sourceId)})-[:HAS_WORD]->(word:Word)
OPTIONAL MATCH (word)-[:ETYM]->(etym:Word)
WITH DISTINCT root, word, etym
OPTIONAL MATCH (ci:CorpusItem)-[:HAS_WORD]->(word)
  WHERE ci.corpus_id = toInteger($countCorpusId)
    AND ($countSurahNumbers IS NULL OR ci.surah_number IN $countSurahNumbers)
RETURN root, word, etym, count(ci) AS corpus_count
LIMIT toInteger($limit)
```

Each word node in the serialized response gets `corpus_count` from its record. The count-only params do **not** filter which words are returned — all words of the root are returned (lexical expansion).

### 3. Search — Batch Count (`routes/modules/search-modern.js`)

All three root search endpoints (`search-roots`, `search-combinate`, `search-extended`) run a batch count query after their main search:

```javascript
const getCorpusCounts = async (session, rootIds, corpusId, surahNumbers) => {
  // MATCH (root:Root)-[:HAS_WORD]->(:Word)<-[:HAS_WORD]-(ci:CorpusItem)
  // WHERE root.root_id IN $rootIds
  //   AND ci.corpus_id = toInteger($corpusId)
  //   AND ($surahNumbers IS NULL OR ci.surah_number IN $surahNumbers)
  // RETURN root.root_id AS root_id, count(ci) AS corpus_count
};
```

Returns `Map<root_id, count>`. Counts are merged into results before the response. One extra query per search request when corpus filter is active.

---

## Frontend Implementation

### Count param threading (`src/contexts/GraphDataContext.js`)

`GraphDataContext` now imports `useCorpusFilter`. On root→word expansion, corpus context is passed as count-only options:

```javascript
const countCorpusId = corpusFilter && corpusFilter !== 'lexicon' ? corpusFilter : null;
const options = {
  L1, L2, limit: 100,
  ...(countCorpusId ? { count_corpus_id: countCorpusId } : {}),
  ...(countCorpusId && surahFilter?.length > 0 ? { count_surah_numbers: surahFilter } : {}),
};
```

### API forwarding (`src/services/apiService.js`)

`expandGraph` forwards `count_corpus_id` and `count_surah_numbers` as query params:

```javascript
if (options.count_corpus_id) params.append('count_corpus_id', options.count_corpus_id);
if (options.count_surah_numbers?.length > 0)
  params.append('count_surah_numbers', options.count_surah_numbers.join(','));
```

### NodesTable display (`src/components/graph/NodesTable.js`)

`showLocationColumn` is true when any node has `type === 'corpusitem'` OR `corpus_count != null`.

`formatLocation` returns:
- CorpusItem: `"69:51:3"` (surah:ayah:word_position, or fallback to `item_id`)
- Root/Word with count: `"10 items"` / `"1 item"`
- Other: `null` (cell is blank)

---

## Scope and Constraints

- **Fulltext search**: Words returned by fulltext search do not get `corpus_count`. Fulltext results are already filtered to the corpus, so the count would equal the number of matches — less meaningful. Can be added later.
- **radical-search endpoint**: Not annotated (no corpus filter support yet on this endpoint).
- **Count accuracy**: Count reflects CorpusItem nodes linked via `HAS_WORD`, not unique ayahs. One ayah with the same root appearing 3 times = 3 items.
- **Surah scope**: When `surahFilter` is active, the count reflects items in those surahs only.
- **No caching**: Counts are recomputed on every search/fetch. For search this is one extra query; for random-nodes it is inline.

---

**Last Updated**: April 7, 2026
**Files**: `routes/modules/graph.js`, `routes/modules/search-modern.js`, `src/contexts/GraphDataContext.js`, `src/services/apiService.js`, `src/components/graph/NodesTable.js`
**See Also**: [Corpus Filter Documentation](CORPUS-FILTER-DOCUMENTATION.md), [Surah Filter Documentation](SURAH-FILTER-DOCUMENTATION.md)
