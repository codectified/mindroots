# MindRoots Validation System Documentation

## Overview

The MindRoots validation system allows users to edit and approve linguistic data fields through the Node Inspector interface. **Approval node creation has been DISABLED** - the system now only updates field values and validation counters without creating audit trail nodes.

## **Editable/Validatable Fields**
The following 11 fields can be edited and validated in the Node Inspector:
- **english** - English translation
- **wazn** - Arabic morphological pattern 
- **spanish** - Spanish translation
- **urdu** - Urdu translation
- **classification** - Linguistic classification
- **transliteration** - Romanized form
- **frame** - Morphological frame
- **opposite** - Antonym/opposite meaning
- **metaphor** - Metaphorical usage
- **dua** - Prayer/supplication context
- **notes** - Additional notes

## Database Structure (TESTED & VERIFIED)

### Word Node (Before Validation)
```cypher
(:Word {
  word_id: 1,
  arabic: "أَبَّ",
  english: "Prepared himself",
  wazn: "فَعَلَ",
  spanish: "padre",
  urdu: "والد",
  classification: "unknown"
  // ... other properties
})
```

### Word Node (After Validation)
```cypher
(:Word {
  word_id: 1,
  arabic: "أَبَّ", 
  english: "to prepare oneself",      // ← Field value updated
  wazn: "فَعَلَ",                      // ← Field value updated 
  wazn_validated_count: 1,             // ← Counter added
  spanish: "padre",
  urdu: "والد",
  classification: "unknown"
  // ... other properties
})
```

### ⚠️ Approval Node Creation DISABLED
```cypher
// PREVIOUS BEHAVIOR (No longer active):
// (:Word)-[:APPROVED_BY]->(:Approval {...})

// CURRENT BEHAVIOR: Only validation counters are updated
(:Word {
  word_id: 1,
  wazn: "فَعَلَ",                      // Field value updated
  wazn_validated_count: 1              // Counter incremented
  // NO approval nodes created
})
```

### Complete Database Structure (Current)
```cypher
// Current simplified structure:
(:Word {word_id: 1, wazn: "فَعَلَ", wazn_validated_count: 1})
// No [:APPROVED_BY] relationships created
// No :Approval nodes created
```

## API Testing Results

### 1. Field Update + Approval (CURRENT BEHAVIOR)
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -d '{"updates": {"wazn": {"value": "فَعَلَ"}}}' \
     "http://localhost:5001/api/update-validation/word/1"

# Result: 
# - wazn field updated to "فَعَلَ"  
# - wazn_validated_count incremented
# - NO approval nodes created (disabled)
```

### 2. Multiple Field Updates (CURRENT BEHAVIOR)  
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -d '{"updates": {"english": {"value": "to prepare"}, "wazn": {"value": "فَعَلَ"}}}' \
     "http://localhost:5001/api/update-validation/word/1"

# Result:
# - Both fields updated with new values
# - Validation counters updated as needed
# - NO approval audit trail created
```

### 3. Field Value Update Only (SUCCESS)
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -d '{"updates": {"english": {"value": "to prepare oneself"}}}' \
     "http://localhost:5001/api/update-validation/word/1"

# Result:
# - english field changed: "Prepared himself" → "to prepare oneself"
# - No approval counters affected
# - No Approval nodes created
```

## Frontend Integration

### Save Changes Workflow (Current)
1. **User Edits**: Types in field → `pendingUpdates` tracks change → "Save Changes" appears
2. **User Approves**: Clicks 👍 button → validation count incremented (NO approval nodes created)
3. **User Saves**: Clicks "Save Changes" → all changes batched to `/update-validation`
4. **Backend Persists**: Updates Neo4j field values + increments validation counters
5. **UI Updates**: Clears pending changes, shows success message, hides "Save Changes"

### Field States
- **Unlocked**: Editable input, 👍 button enabled
- **Locked**: Disabled input 🔒, 👍 button still enabled for additional votes
- **Changed**: "Save Changes" button appears until saved

## Security Features

### ⚠️ IP-Based Spam Protection DISABLED
```cypher
// PREVIOUS spam protection (no longer active):
// MATCH (n)-[:APPROVED_BY]->(approval:Approval) WHERE ...

// CURRENT: No spam protection needed since approval nodes disabled
// Field updates proceed normally without IP tracking
```

### Input Validation
- **Empty Values**: Cannot be approved (frontend validation)
- **Wazn Field**: Must contain at least one Arabic character
- **Node Type**: Only 'word', 'root', 'form', 'corpusitem' allowed

## Backend Implementation Details

### Endpoint: `POST /update-validation/:nodeType/:nodeId`

**Request Body:**
```json
{
  "updates": {
    "wazn": {
      "value": "فَعَلَ",
      "approve": true
    },
    "english": {
      "value": "to prepare oneself"
    }
  }
}
```

**Processing Logic (Current):**
1. Validate node type and find node
2. **Simplified Processing**:
   - Update field values: `SET n.fieldName = $value`
   - Increment counters: `SET n.fieldName_validated_count = COALESCE(n.fieldName_validated_count, 0) + 1`
   - **NO approval node creation**
   - **NO IP spam protection checks**
3. Return updated node data

**Response:**
```json
{
  "success": true,
  "message": "Updated 2 fields",
  "nodeData": { /* complete updated node */ }
}
```

## Field Display Order in Node Inspector

Properties displayed in Node Inspector (updated September 2025):
1. **arabic** - Source text (read-only)
2. **definitions** - Lane's Lexicon definitions (read-only)
3. **wazn** - Morphological pattern ✏️ **EDITABLE**
4. **english** - English translation ✏️ **EDITABLE**
5. **transliteration** - Romanized form ✏️ **EDITABLE**
6. **urdu** - Urdu translation ✏️ **EDITABLE**
7. **spanish** - Spanish translation ✏️ **EDITABLE**
8. **hanswehr_entry** - Hans Wehr dictionary (read-only)
9. **frame** - Morphological frame ✏️ **EDITABLE**
10. **opposite** - Antonym/opposite ✏️ **EDITABLE**
11. **metaphor** - Metaphorical usage ✏️ **EDITABLE**
12. **dua** - Prayer context ✏️ **EDITABLE**
13. **notes** - Additional notes ✏️ **EDITABLE**
14. **classification** - Linguistic classification ✏️ **EDITABLE**
15. **IDs** - word_id, root_id, etc. (read-only)
16. **Everything else** - Technical fields (read-only)

### Section Order
1. **Properties** (with editing capabilities)
2. **Relationships** 
3. **Connected Node Types**
4. **Summary** (moved to bottom)
5. **Raw Data (Advanced)** (collapsible)

## Files Modified

### Backend
- `routes/api.js`: Added `/update-validation` endpoint (lines 2750-2862)
- Sequential query processing to avoid Neo4j transaction conflicts
- IP tracking and spam protection logic

### Frontend  
- `src/components/graph/NodeInspector.js`: Added save functionality
- `src/services/apiService.js`: Added `updateValidationFields()` API call
- `src/styles/info-bubble.css`: Added save button and status message styles

### Database Schema
- **Word nodes**: Added `*_validated_count` properties dynamically
- **Approval nodes**: New node type with field/IP/timestamp tracking
- **Relationships**: `[:APPROVED_BY]` connects nodes to their approvals

## Testing Commands

```bash
# Test word navigation
curl "http://localhost:5001/api/navigate/word/1/next" \
     -H "Authorization: Bearer localhost-dev-key-123"

# Test validation update  
curl -X POST "http://localhost:5001/api/update-validation/word/1" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -H "Content-Type: application/json" \
     -d '{"updates": {"wazn": {"value": "فَعَلَ", "approve": true}}}'

# Check validation counters (no approval nodes to query)
curl -X POST "http://localhost:5001/api/execute-query" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -H "Content-Type: application/json" \
     -d '{"query": "MATCH (n:Word) WHERE n.word_id = 1 RETURN n.wazn, n.wazn_validated_count, n.english"}'
```

## Next Steps / Potential Enhancements

1. **Admin Panel**: View all approvals, manage spam IPs
2. **User Authentication**: Replace IP tracking with user accounts  
3. **Approval Thresholds**: Require N approvals before field is considered "validated"
4. **Rollback System**: Ability to revert field changes
5. **Batch Processing**: Approve multiple fields across multiple nodes
6. **Analytics**: Track approval patterns, popular fields, user contribution

---

**Last Updated**: September 9, 2025  
**Status**: ✅ Updated - Approval node creation disabled, field order updated  
**Changes**: 
- **September 2025**: Disabled approval node creation, reordered fields (arabic, definitions first), moved Summary section to bottom
- **August 2025**: Original implementation with full approval audit trail