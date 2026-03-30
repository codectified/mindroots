# Corpus Filter — Feature Documentation

**Date Added**: March 26, 2026
**Status**: Production-Ready ✅
**Impact**: Unified corpus scoping across all search and node expansion operations

---

## Overview

The corpus filter restricts all search retrieval and node graph expansion to words/roots that appear in a specific corpus (Poetry, Quran, or Prose). When set to "Lexicon" (the default), no filtering is applied and the full lexical database is used.

---

## Context API

**File**: `src/contexts/CorpusFilterContext.js`

```javascript
const { corpusFilter, setCorpusFilter } = useCorpusFilter();
// corpusFilter: 'lexicon' | 1 | 2 | 3
```

### Auto-sync behavior
`corpusFilter` auto-syncs with `selectedCorpus` from `CorpusContext`. When a user navigates to a corpus in the Corpus screen, `corpusFilter` updates automatically.

### Provider
Registered in `App.js` as `<CorpusFilterProvider>`, wrapping all screens.

---

## Corpus IDs

| ID | Corpus | CorpusItem count |
|---|---|---|
| `'lexicon'` | Full lexicon (no filter) | — |
| `1` | Poetry | ~98 |
| `2` | Quran | ~77,429 |
| `3` | Prose | ~684 |

**Schema note**: All CorpusItems store corpus membership as a `corpus_id` integer property. The `BELONGS_TO` relationship to a Corpus node exists only for Poetry and Prose; Quran uses property-only. All corpus filtering therefore uses the property-based approach uniformly:

```cypher
MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(word)
```

---

## UI: ContextShiftSelector

**File**: `src/components/selectors/ContextShiftSelector.js`

A single "Corpus:" dropdown that reads/writes `corpusFilter`. Renders wherever included:
- **MiniMenu** (global mini-menu, always available)
- **BottomNav** (mobile bottom navigation)
- **Search page** — shown inline next to "Advanced Search" heading
- **Explore page** — shown inline next to "Knowledge Graph Exploration" heading

---

## Where corpusFilter is applied

### Search retrieval (Search.js)

Both root search and full text search pass `corpusFilter` as `corpus_id` to their respective API endpoints. The helper `corpusId(corpusFilter)` returns `null` when value is `'lexicon'`, otherwise passes the corpus ID number.

| Search type | Endpoint | corpus_id param |
|---|---|---|
| Root search | `/search-roots` | ✅ |
| Combinate | `/search-combinate` | ✅ |
| Extended | `/search-extended` | ✅ |
| Full text | `/search-fulltext` | ✅ |

### Node expansion (GraphDataContext.js)

**No corpus filter is applied to any expansion.** Expansion is always lexicon-scoped so users can freely explore the full graph from corpus-filtered starting points.

Rationale: a corpus-filtered search returns words that appear in that corpus. From those words, the user may want to explore connected roots, forms, or corpus items that are *not* in that corpus — restricting expansion would break this traversal.

| Expansion type | corpus_id applied |
|---|---|
| Root → Word | ❌ always lexical |
| Form → Word | ❌ always lexical |
| Word → CorpusItem | ❌ always lexical |
| Word → Root (2nd click) | ❌ always lexical |
| Context menu expand | ❌ always lexical |

### Explore random node fetch (Explore.js)

When `corpusFilter` is set, `corpus_id` is added to the `filters` object passed to `fetchRandomNodes`. Backend support required for full effect (see Known Constraints). Once a random node lands, expansion from it is always lexical.

### CorpusGraphScreen

Uses its own `selectedCorpus` directly for corpus navigation — `corpusFilter` auto-syncs to match, ensuring node expansion on the corpus screen also stays within scope.

---

## Backend implementation

### Root search corpus gate (search-modern.js)
```cypher
WITH root WHERE EXISTS {
  MATCH (root)-[:HAS_WORD]->(:Word)<-[:HAS_WORD]-(:CorpusItem {corpus_id: toInteger($corpusId)})
}
```

### Full text search corpus gate (search-modern.js)
```cypher
CALL db.index.fulltext.queryNodes('wordLexicalText', $query)
YIELD node AS word, score
MATCH (ci:CorpusItem {corpus_id: toInteger($corpusId)})-[:HAS_WORD]->(word)
MATCH (root:Root)-[:HAS_WORD]->(word)
RETURN word, root, score
ORDER BY score DESC LIMIT N
```

### Word/Form/Root expansion (inspection.js)
The `/expand` endpoint accepts optional `corpus_id` param and injects a corpus gate when present.

---

## Known Constraints

- **Explore random fetch**: Frontend passes `corpus_id` but backend `fetchRandomNodes` may not yet filter by corpus. Nodes returned may not be restricted to the selected corpus until backend is updated.
- **Auto-expand / share links**: The `autoExpandRootId` and `?root=` share link flows in Explore.js call `expandGraph` without corpus filter. This is intentional — share links should always load regardless of the viewer's current corpus filter.

---

## Architecture

```
CorpusFilterContext
  corpusFilter ('lexicon' | 1 | 2 | 3)
  auto-syncs with selectedCorpus
       ↓
ContextShiftSelector (UI — in MiniMenu, BottomNav, Search, Explore)
       ↓
  ┌────────────────────────────────────────────────────────┐
  │ Search.js         corpus_id → all 4 search endpoints  │
  │ Explore.js        corpus_id → fetchRandomNodes          │
  └────────────────────────────────────────────────────────┘

  GraphDataContext.js — expansion is ALWAYS lexical (no corpus_id)
    ↳ users start from corpus-filtered results and explore freely
```

---

**Last Updated**: March 26, 2026
**Files**: `src/contexts/CorpusFilterContext.js`, `src/components/selectors/ContextShiftSelector.js`
**See Also**: [Full-Text Search](FULLTEXT-SEARCH-DOCUMENTATION.md), [Radical Search Integration](RADICAL-SEARCH-INTEGRATION.md)
