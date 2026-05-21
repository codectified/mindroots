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

When `corpusFilter` is set, `corpus_id` is passed to `fetchRandomNodes`. The backend (`/random-nodes/:nodeType`) scopes the query to nodes that appear in CorpusItems with that `corpus_id`:

- **Word**: `MATCH (ci:CorpusItem {corpus_id})-[:HAS_WORD]->(n:Word)`
- **Root**: `MATCH (ci:CorpusItem {corpus_id})-[:HAS_WORD]->(w:Word)<-[:HAS_WORD]-(r:Root)`
- **Form**: `MATCH (ci:CorpusItem {corpus_id})-[:HAS_WORD]->(w:Word)-[:HAS_FORM]->(f:Form)`

Once a random node lands on the graph, expansion from it is always lexical.

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

---

## Explore Page Filter Behavior

The Explore page explicit fetch buttons (Word / Root / Form) respect the corpus filter and global word filters:

- **Word**: filters by `wordTypes`, `semLangs`, and `corpus_id` at the backend
- **Root**: filters by `rootTypes` and `corpus_id` at the backend
- **Form**: filters by `classification IN ['Grammatical', 'Morphological']` and `corpus_id` at the backend. The "Form" button is **hidden** in basic/guided mode or when `hideFormNodes` is enabled — so it only appears when the user has explicitly opted into seeing form nodes in advanced mode.

Nodes returned by Explore are normalized through `normalizeNodes` before entering `graphData`, ensuring `node_type` is set correctly so the client-side `applyFilter` in `GraphDataContext` functions as a consistent safety net across both random fetches and expansion results.

---

**Last Updated**: April 5, 2026
**Files**: `src/contexts/CorpusFilterContext.js`, `src/components/selectors/ContextShiftSelector.js`, `routes/modules/graph.js`, `src/components/graph/Explore.js`
**See Also**: [Full-Text Search](FULLTEXT-SEARCH-DOCUMENTATION.md), [Radical Search Integration](RADICAL-SEARCH-INTEGRATION.md)
