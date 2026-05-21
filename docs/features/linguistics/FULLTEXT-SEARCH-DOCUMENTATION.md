# Full-Text Search — Feature Documentation

## Overview

Full-text search enables **purely semantic** dictionary search over the MindRoots lexical graph — searching Lane's Lexicon and Hans Wehr by meaning and definition text — as opposed to the structural radical-position search system.

Built on Neo4j's native Lucene-based full-text indexes. No external search infrastructure required.

Two semantic layers are exposed:
- **Lane's Lexicon** (`definitions`) — deep, historical, nuanced Arabic definitions
- **Hans Wehr** (`hanswehr_entry`) — modern, concise dictionary definitions

---

## Neo4j Indexes

Created on 2026-03-25 using Neo4j 5.x `CREATE FULLTEXT INDEX` syntax.

### wordLexicalText (active — semantic search)
```cypher
CREATE FULLTEXT INDEX wordLexicalText IF NOT EXISTS
FOR (n:Word) ON EACH [n.definitions, n.hanswehr_entry]
```
Covers ~all Word nodes for `definitions`, ~8,844 for `hanswehr_entry`.

### wordText / rootText (retained, not used by endpoint)
Earlier broad indexes kept for potential future use. The endpoint uses `wordLexicalText` only.

### Verification
```cypher
SHOW INDEXES WHERE type = "FULLTEXT"
```

---

## Backend Endpoint

**`GET /api/search-fulltext`**

Defined in: `routes/modules/search-modern.js`

### Request Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `query` | string | required | Search string (English or Arabic). Supports Lucene syntax. |
| `sources` | string | all three | Comma-separated: `lane`, `hanswehr`, `labels` |
| `limit` | number | `25` | Max results (capped at 100) |
| `corpus_id` | number | none | When set, restricts results to words appearing in that corpus |

### Lucene Query Syntax (pass-through)

| Syntax | Example | Behavior |
|---|---|---|
| Plain | `love` | Standard term search |
| Fuzzy | `lov~` | Edit-distance matching |
| Phrase | `"fear god"` | Exact phrase in definitions |
| Boolean | `love AND mercy` | Both terms required |
| Boolean | `love OR mercy` | Either term |

### Response Format

```json
{
  "results": [
    {
      "score": 12.3,
      "source": "lane",
      "root": { "root_id": 42, "arabic": "ح-ب-ب", ... },
      "matchedWords": [
        { "word_id": 101, "english": "Love", "definitions": "...", "matchSource": "lane" },
        ...
      ]
    }
  ],
  "total": 3,
  "query": "love",
  "message": "Found 3 results for \"love\""
}
```

### `source` field values

| Value | Meaning |
|---|---|
| `lane` | Match found in `Word.definitions` (Lane's Lexicon) |
| `hanswehr` | Match found in `Word.hanswehr_entry` (Hans Wehr) |
| `null` | Match detected in neither (Lucene matched but substring check inconclusive) |

### Source Detection Logic

Post-query substring check determines which field matched:
```javascript
if (word.definitions?.toLowerCase().includes(lowerQuery)) → 'lane'
else if (word.hanswehr_entry?.toLowerCase().includes(lowerQuery)) → 'hanswehr'
```

When `source=lane` or `source=hanswehr` is passed, results are filtered and `matchedWords` is trimmed to only words matching that source.

---

## Frontend

### API Service (`src/services/apiService.js`)

```javascript
searchFullText(query, sources = null, limit = 25, corpus_id = null)
// sources: array e.g. ['lane'], ['hanswehr', 'labels'], null = all three
// corpus_id: number or null — passed from CorpusFilterContext
```

### UI (`src/components/graph/Search.js`)

A **Full Text Search** section above Root Search:
- Text input (Enter key submits)
- Checkboxes (multi-select): Lane's Lexicon (default) / Hans Wehr / Word Labels
- Results are Word nodes displayed in same graph/table as radical search
- Result count shown below checkboxes
- Corpus filter applied from `corpusFilter` via `CorpusFilterContext` (same filter used by root search and all node expansion — one unified scope)

---

## Corpus Filter

When `corpus_id` is provided, results are restricted to words that appear in CorpusItems belonging to that corpus. Integrates with `CorpusFilterContext` in the frontend.

### Corpus IDs
| ID | Corpus |
|---|---|
| `1` | Poetry |
| `2` | Quran |
| `3` | Prose |

### How it works
A MATCH clause is injected before the Root join, requiring the word to exist in a CorpusItem with the matching `corpus_id` property:

```cypher
CALL db.index.fulltext.queryNodes('wordLexicalText', $query)
YIELD node AS word, score
MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(word)  -- corpus gate
MATCH (root:Root)-[:HAS_WORD]->(word)
RETURN word, root, score
ORDER BY score DESC LIMIT N
```

**Important**: Corpus 2 (Quran, 77k CorpusItems) stores corpus membership as a `corpus_id` property on the node — not via a `BELONGS_TO` relationship. The property-based approach works uniformly across all three corpora.

### Frontend integration
Both full text search and root search in `Search.js` read `corpusFilter` from `CorpusFilterContext`. A single corpus scope controls all search and expansion behavior across the app.

`ContextShiftSelector` (in the mini-menu, bottom nav, and inline on Search/Explore pages) is the UI for setting `corpusFilter`.

---

## Architecture

```
User Query + source filter + corpus_id (from CorpusFilterContext)
   ↓
GET /api/search-fulltext
   ↓
Neo4j wordLexicalText / wordLabelText index
   ↓
[corpus gate: CorpusItem {corpus_id} -[:HAS_WORD]-> word]  ← only when corpus_id set
   ↓
Word hits → walk back to Root via HAS_WORD
   ↓
Source detection (substring check per word)
   ↓
Source filter (if requested)
   ↓
Word-centered results sorted by score DESC → frontend graph/table
```

---

## Known Constraints

- **Neo4j Aura**: No custom Lucene analyzers — Arabic stemming unavailable. Arabic search works on exact tokens in definition text.
- **Source detection** is a post-hoc substring check — accurate for plain queries, may be inconclusive for fuzzy/phrase queries (source will be `null`).
- **Hans Wehr coverage**: ~8,844 nodes. Searches against `source=hanswehr` will naturally return fewer results.
- Ranking is Lucene's default TF-IDF — no custom boosting yet.

---

## What's Implemented

- ✅ `wordLexicalText` index (`definitions` + `hanswehr_entry`)
- ✅ `wordLabelText` index (`english` + `arabic`)
- ✅ `wordText` / `rootText` indexes (retained, not used by endpoint)
- ✅ `/search-fulltext` endpoint — multi-source, source detection, corpus filter
- ✅ Lucene syntax pass-through (fuzzy, phrase, boolean)
- ✅ `searchFullText(query, sources, limit, corpus_id)` in apiService.js
- ✅ Full Text Search UI — text input + Lane/Hans Wehr/Word Labels checkboxes
- ✅ Corpus filter integration via `CorpusFilterContext` (`corpusFilter`)

## Out of Scope

- Form search
- Boosting/ranking tuning
- Arabic analyzer customization

---

**Last Updated**: March 26, 2026
**Module Location**: `routes/modules/search-modern.js`
