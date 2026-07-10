# Validation System Documentation

**Date Added**: August 30, 2025
**Status**: Production-Ready ✅
**Impact**: Inline editing and approval workflow for linguistic data quality assurance

> This doc covers the **inline field editing + approval** feature only. For the inspector UI itself, supported node types, endpoints, and the custom tagger, see [NODE-INSPECTOR-DOCUMENTATION.md](NODE-INSPECTOR-DOCUMENTATION.md).

---

## Overview

The Validation System provides inline editing of linguistic fields directly in the Node Inspector, with per-field approval counters. Users edit values, optionally approve them (👍), and batch-save all changes.

## Editable Fields

Defined in `src/components/graph/NodeInspector.js` (`validationFields`):

| Node type | Fields |
|---|---|
| Word / Root / Form | `english`, `wazn`, `spanish`, `urdu`, `classification`, `transliteration`, `frame`, `opposite`, `metaphor`, `dua`, `notes` |
| CorpusItem | `english`, `transliteration`, `qrootfreq`, `quran_frequency` |

Only fields that exist as properties on the node are rendered; each editable field shows a text input plus a 👍 approve button with the current count.

### Field Locking Logic

- A field with `<field>_validated_count >= 1` is **locked**: the input is disabled and shows a 🔒 indicator.
- Locking happens immediately in the UI on first approve, and persists because the counter is saved to the node.
- Approving remains possible on locked fields (counter keeps incrementing); editing the value does not.

### Client-side validation

- Empty values cannot be approved.
- `wazn` must contain at least one Arabic character (`/[؀-ۿ]/`).

## State Management

Three state objects in `NodeInspector.js`:

```javascript
fieldValues:     { wazn: "فَعَلَ", english: "to prepare" }     // current input values
validationData:  { wazn: { validated_count: 3, locked: true } } // counters + lock state
pendingUpdates:  { wazn: { value: "فَعَلَ" } }                  // batch for next save
```

All three reset when `nodeData` changes (i.e. on previous/next navigation). Changes accumulate in `pendingUpdates` and are persisted together via the **Save Changes** button in the footer.

> **Note**: the frontend no longer sends `approve: true` in updates — approval clicks only increment the counter via the saved `<field>_validated_count`. The backend's Approval-node audit trail (below) remains in place for API callers that do send `approve: true`.

## API

### Endpoint

`POST /update-validation/:nodeType/:nodeId` — implemented in `routes/modules/inspection.js`. Valid node types: `word`, `root`, `form`, `corpusitem` (looked up by `<nodeType>_id` property).

```json
// Request
{
  "updates": {
    "wazn":    { "value": "فَعَلَ", "approve": true },
    "english": { "value": "to prepare oneself" }
  }
}

// Response
{
  "success": true,
  "message": "Updated 2 fields",
  "nodeData": { "...": "full updated node properties" }
}
```

Per field, the handler:
1. Sets `n.<field> = value` if `value` is present.
2. If `approve: true`: checks spam protection, then creates an Approval node and increments `n.<field>_validated_count`.

### Approval audit trail (backend)

```cypher
(n)-[:APPROVED_BY]->(:Approval {
  field: "wazn",
  ip: "192.168.1.1",
  timestamp: datetime(),
  value: "فَعَلَ"
})
```

### Spam protection

One approval per IP per field per node per 24 hours; repeat approvals within the window are silently skipped (the rest of the update still applies).

### Frontend service

`src/services/apiService.js`:

```javascript
export const updateValidationFields = async (nodeType, nodeId, updates) => {
  const response = await api.post(`/update-validation/${nodeType}/${nodeId}`, { updates });
  return convertIntegers(response.data);
};
```

## User Experience Flow

1. Open the Node Inspector (context menu → "Inspect Node" — see [Node Inspector doc](NODE-INSPECTOR-DOCUMENTATION.md#how-the-inspector-is-opened))
2. Edit values directly in the input fields
3. Optionally click 👍 to approve a value (locks the field)
4. Click **Save Changes** to persist the batch
5. Status message confirms (`✓ Saved N changes`) or reports an error

## Testing

```bash
# Local
curl -X POST "http://localhost:5001/api/update-validation/word/16089" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"updates": {"wazn": {"value": "فَعَلَ"}}}'
```

```cypher
// Approval history for a word
MATCH (w:Word {word_id: 16089})-[:APPROVED_BY]->(a:Approval)
RETURN a.field, a.value, a.timestamp, a.ip ORDER BY a.timestamp DESC;

// Most-validated fields
MATCH ()-[:APPROVED_BY]->(a:Approval)
RETURN a.field, count(a) AS approvals ORDER BY approvals DESC;
```

## Troubleshooting

- **Save button missing** — `hasChanges` only flips on actual input changes; locked fields ignore edits.
- **Counter not updating** — counters come from `<field>_validated_count` on the node; check the saved node properties.
- **429 / skipped approvals** — IP approved that field within the last 24h (`checkSpamProtection` window in `inspection.js`).
- **Node not found** — node lookup is by `<nodeType>_id` property; corpus items with hierarchical IDs are not addressable here.

## Future Enhancements

- Approval thresholds with expert override
- Per-user (not per-IP) approval tracking
- Validation history timeline in the UI
- Extending validation to Ayah nodes (currently read-only — see [Known Limitations](NODE-INSPECTOR-DOCUMENTATION.md#known-limitations))

---

**Last Updated**: June 12, 2026
**See Also**: [Node Inspector](NODE-INSPECTOR-DOCUMENTATION.md), [Corpus Navigation](CORPUS-NAVIGATION-SYSTEM.md)
