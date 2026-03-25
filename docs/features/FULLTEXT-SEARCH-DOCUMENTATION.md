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
| `source` | string | none (both) | `lane` or `hanswehr` to filter by dictionary source |
| `limit` | number | `25` | Max results (capped at 100) |

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
searchFullText(query, source = null, limit = 25)
// source: 'lane' | 'hanswehr' | null (both)
```

### UI (`src/components/graph/Search.js`)

A **Lexical Search** section above the radical search controls:
- Text input (Enter key submits)
- Radio buttons: Lane's Lexicon (default) / Hans Wehr / Both
- Results displayed in same graph/table as radical search
- Result count shown below radio buttons

---

## Architecture

```
User Query + source filter
   ↓
GET /api/search-fulltext
   ↓
Neo4j wordLexicalText index (definitions + hanswehr_entry)
   ↓
Word hits → walk back to Root via HAS_WORD
   ↓
Source detection (substring check per word)
   ↓
Source filter (if requested)
   ↓
Merge by root_id, sort by score DESC
   ↓
Root-centered results → frontend graph/table
```

---

## Known Constraints

- **Neo4j Aura**: No custom Lucene analyzers — Arabic stemming unavailable. Arabic search works on exact tokens in definition text.
- **Source detection** is a post-hoc substring check — accurate for plain queries, may be inconclusive for fuzzy/phrase queries (source will be `null`).
- **Hans Wehr coverage**: ~8,844 nodes. Searches against `source=hanswehr` will naturally return fewer results.
- Ranking is Lucene's default TF-IDF — no custom boosting yet.

---

## What's Implemented

- ✅ `wordLexicalText` index (definitions + hanswehr_entry only — no noise)
- ✅ `/search-fulltext` endpoint with source detection and filter
- ✅ Lucene syntax pass-through (fuzzy, phrase, boolean)
- ✅ `searchFullText(query, source, limit)` in apiService.js
- ✅ Lexical Search UI in Search.js (text input + Lane/Hans Wehr/Both radio buttons)

## Out of Scope

- CorpusItem search
- Form search
- Boosting/ranking tuning
- Arabic analyzer customization

---

**Last Updated**: March 25, 2026
**Module Location**: `routes/modules/search-modern.js`
