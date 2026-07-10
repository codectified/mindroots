# Node Inspector Documentation

**Date Added**: June 12, 2026
**Status**: Production-Ready ✅
**Impact**: Central hub for inspecting any node's properties, relationships, and connected counts — with inline validation editing and custom tagging

---

## Overview

The Node Inspector is a modal overlay that shows everything about a single graph node: all properties, relationship counts by type/direction, connected node type counts, and a raw-data dump. It also hosts two write features:

- **Validation editing** — inline editing of linguistic fields with approval counters → [Validation System](VALIDATION-SYSTEM-DOCUMENTATION.md)
- **Custom tagger** — add arbitrary key/value properties to a node (documented below)

This document is the index for everything inspector-related. Feature-specific details live in their own docs:

| Topic | Doc |
|---|---|
| Inspector UI, endpoints, supported node types, custom tagger | this document |
| Inline field editing + approval workflow | [VALIDATION-SYSTEM-DOCUMENTATION.md](VALIDATION-SYSTEM-DOCUMENTATION.md) |
| Previous/next navigation (`global_position`) | [CORPUS-NAVIGATION-SYSTEM.md](CORPUS-NAVIGATION-SYSTEM.md) |

---

## How the Inspector Is Opened

The inspector is always reached through the **NodeContextMenu** ("Inspect Node" action). The context menu is activated from three surfaces:

| Surface | File | Trigger |
|---|---|---|
| Graph view (advanced mode) | `src/components/graph/GraphVisualization.js` | Click any node while advanced mode is on |
| Nodes table | `src/components/graph/NodesTable.js` | Click a row while advanced mode is on |
| Corpus reader (Quran) | `src/components/utils/CorpusRenderer.js` | Click an ayah marker ﴿N﴾ — opens the menu for the **Ayah** node |

Notes on the corpus reader surface:
- Clicking a **word** in the corpus text still navigates to the graph screen (`handleSelectCorpusItem`); only the ayah markers open the context menu.
- If **freeform highlight mode** is active, clicking an ayah marker keeps its original behavior (toggles the ayah highlight) and does *not* open the menu.
- The ayah node is constructed client-side as `{ type: 'ayah', ayah_key: 'surah:aya', surah_id, ayah_id, corpus_id: 2 }` — no API call is needed until an action is chosen.

### Context menu options by node type

Defined in `src/components/graph/NodeContextMenu.js` (`getMenuOptions`):

| Node type | Options |
|---|---|
| `root` | More info, Expand, Collapse, Inspect Node, Report Issue |
| `word` | More info, Expand → (Root / Form / Corpus usage), Inspect Node, Report Issue |
| `form` | More info, Expand, Collapse, Inspect Node, Report Issue |
| `corpusitem` | More info, View in Context, Inspect Node, Report Issue |
| `ayah` | Inspect Node |
| default | More info, Inspect Node, Report Issue |

Actions are dispatched by `handleContextMenuAction` in `src/contexts/GraphDataContext.js`.

---

## Supported Node Types & Endpoints

All inspection endpoints live in `routes/modules/inspection.js`. Route order matters — the specific routes are declared **before** the generic `/inspect/:nodeType/:nodeId`.

| Node type | Endpoint | ID format |
|---|---|---|
| CorpusItem | `GET /inspect/corpusitem/:corpusId/:itemId` | Integer (corpus 1/3) or hierarchical `surah:ayah:word` (corpus 2) |
| Ayah | `GET /inspect/ayah/:ayahKey` | String `surah:ayah` (e.g. `2:3`) |
| Root / Word / Form | `GET /inspect/:nodeType/:nodeId` | Integer (`root_id` / `word_id` / `form_id`) |

### Response shape (all endpoints)

```json
{
  "nodeType": "Ayah",
  "nodeId": "2:3",
  "properties": {
    "ayah_key": { "value": "2:3", "type": "string", "isEmpty": false }
  },
  "relationships": [
    { "type": "HAS_ITEM", "direction": "outgoing", "count": 8 }
  ],
  "connectedNodeCounts": { "corpusItems": 8, "surahs": 1 },
  "summary": {
    "totalProperties": 5,
    "totalRelationships": 9,
    "totalConnectedNodes": 9
  }
}
```

### Ayah nodes

Ayah nodes are the structural layer for the Quran (Corpus 2): they collect the corpus item (token) nodes of one verse.

```cypher
(:Surah)-[:HAS_AYAH]->(:Ayah {ayah_key: "2:3", surah_id: 2, ayah_id: 3, corpus_id: 2})
(:Ayah)-[:HAS_ITEM]->(:CorpusItem)
```

The ayah endpoint validates the key format (`/^\d+:\d+$/`) and matches on `ayah_key`. See [Neo4j Schema](../../neo4j/schema.md) for the full structural layer.

```bash
# Local test
curl "http://localhost:5001/api/inspect/ayah/2:3" \
     -H "Authorization: Bearer $API_KEY"
```

### Frontend API service

`src/services/apiService.js` → `inspectNode(nodeType, nodeId, corpusId)`:
- `corpusitem` + corpusId → `/inspect/corpusitem/:corpusId/:itemId`
- everything else (including `ayah`) → `/inspect/:nodeType/:nodeId` (colons in `ayah_key` / hierarchical IDs are legal in a path segment)

---

## Navigation (Previous / Next)

The inspector header shows ←/→ buttons for **Word** and **CorpusItem** nodes (`onNavigate` → `handleNodeNavigation` in `GraphDataContext.js`). Endpoints:

- `GET /navigate/word/:wordId/:direction`
- `GET /navigate/corpusitem/:corpusId/:itemId/:direction`
- `GET /navigate-by-position/:corpusId/:globalPosition/:direction` (preferred for Quran)

Details: [CORPUS-NAVIGATION-SYSTEM.md](CORPUS-NAVIGATION-SYSTEM.md). Ayah nodes have no navigation yet (see Known Limitations).

---

## Custom Tagger

Lets users attach an arbitrary string property ("tag") to a node from the inspector, with an audit trail.

### Frontend

`src/components/graph/NodeInspector.js`:
- **"+ Tag"** button in the inspector header toggles an inline panel with key/value inputs.
- Key is normalized to lowercase and validated client-side before submitting.
- Success and error messages render inline in the panel; the panel auto-closes 2s after success.

`src/services/apiService.js`:

```javascript
export const addCustomTag = async (nodeType, nodeId, key, value) => {
  const response = await api.post(`/add-tag/${nodeType}/${nodeId}`, { key, value });
  return convertIntegers(response.data);
};
```

### Backend

`POST /add-tag/:nodeType/:nodeId` (`routes/modules/inspection.js`)

```json
// Request
{ "key": "register", "value": "poetic" }

// Response
{ "success": true, "message": "Tag 'register' added successfully" }
```

Validation rules (enforced server-side):

| Rule | Detail |
|---|---|
| Node types | `word`, `root`, `form` (integer IDs) and `ayah` (string key `surah:ayah`, e.g. `/add-tag/ayah/2:3`) — `corpusitem` rejected (composite IDs) |
| Protected fields | `word_id`, `root_id`, `form_id`, `item_id`, `corpus_id`, `entry_id`, `arabic`, `definitions`, `hanswehr_entry`, `global_position`, `surah_number`, `ayah_number`, `word_position`, `ayah_key`, `surah_id`, `ayah_id`, `node_type`, and any `*_validated_count` |
| Key format | `/^[a-z][a-z0-9_]*$/` — lowercase letters, digits, underscores; must start with a letter |
| Value | Must be a string |
| Rate limit | Max 20 tags per IP per 24 hours (429 on exceed) |

### Audit trail

Each tag write sets the property on the node **and** creates a record:

```cypher
(n)-[:TAGGED_BY]->(:TagRecord {
  key: "register",
  value: "poetic",
  ip: "192.168.1.1",
  timestamp: datetime()
})
```

```cypher
// Recent tagging activity
MATCH (n)-[:TAGGED_BY]->(t:TagRecord)
WHERE t.timestamp > datetime() - duration('P7D')
RETURN labels(n)[0], t.key, t.value, t.timestamp ORDER BY t.timestamp DESC;
```

Once added, a tag becomes a regular node property and appears in the inspector's property list on next load (after the non-priority fields).

---

## Known Limitations

- **Ayah validation editing**: the validation endpoint (`/update-validation`) accepts `word`/`root`/`form`/`corpusitem` only — Ayah properties are not inline-editable (custom **tagging** of ayahs is supported). The schema roadmap (`docs/neo4j/schema.md`) also plans `Ayah → Tag` semantic links as a future richer alternative to flat tag properties.
- **Ayah navigation**: no previous/next ayah navigation in the inspector yet (would be a natural extension of `navigate-by-position`).
- **Corpus reader coverage**: only Quran ayah markers open the context menu; corpus 1 (list) and corpus 3 (poetry) items still navigate straight to the graph screen on click. Poetry line markers (`** N **`) are an obvious next surface.
- **Tag deletion**: there is no endpoint to remove a tag; cleanup requires direct Cypher.

---

## File Map

```
Frontend
├── src/components/graph/NodeInspector.js     # Inspector modal (display, validation UI, tag panel)
├── src/components/graph/NodeContextMenu.js   # Per-type menu options
├── src/components/graph/GraphVisualization.js # Menu surface: graph (advanced mode)
├── src/components/graph/NodesTable.js        # Menu surface: table (advanced mode)
├── src/components/utils/CorpusRenderer.js    # Menu surface: ayah markers in Quran reader
├── src/contexts/GraphDataContext.js          # contextMenu / nodeInspectorData state + action dispatch
└── src/services/apiService.js                # inspectNode, addCustomTag, updateValidationFields, navigate*

Backend
└── routes/modules/inspection.js              # /inspect/*, /navigate*, /update-validation, /add-tag
```

---

**Last Updated**: June 12, 2026
**See Also**: [Validation System](VALIDATION-SYSTEM-DOCUMENTATION.md), [Corpus Navigation](CORPUS-NAVIGATION-SYSTEM.md), [Neo4j Schema](../../neo4j/schema.md)
