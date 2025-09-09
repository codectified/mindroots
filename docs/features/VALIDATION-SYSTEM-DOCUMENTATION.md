# MindRoots Validation System Documentation

## Overview

The MindRoots validation system allows users to edit and approve linguistic data fields (wazn, english, spanish, urdu, classification) with backend persistence, spam protection, and approval tracking.

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

### Approval Node (Created on Approval)
```cypher
(:Word)-[:APPROVED_BY]->(:Approval {
  field: "wazn",                       // Which field was approved
  ip: "::1",                          // IP address of approver  
  value: "فَعَلَ",                     // Value that was approved
  timestamp: datetime("2025-08-30T03:51:42.377Z")  // When approved
})
```

### Complete Database Structure
```cypher
// Real structure after testing:
(:Word {word_id: 1, wazn: "فَعَلَ", wazn_validated_count: 1})
-[:APPROVED_BY]->
(:Approval {
  field: "wazn", 
  ip: "::1", 
  value: "فَعَلَ", 
  timestamp: datetime("2025-08-30T03:51:42.377Z")
})
```

## API Testing Results

### 1. Field Update + Approval (SUCCESS)
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -d '{"updates": {"wazn": {"value": "فَعَلَ", "approve": true}}}' \
     "http://localhost:5001/api/update-validation/word/1"

# Result: 
# - wazn field updated to "فَعَلَ"  
# - wazn_validated_count created = 1
# - Approval node created with IP/timestamp
```

### 2. Spam Protection Test (SUCCESS)  
```bash
# Same request again from same IP
curl -X POST -H "Content-Type: application/json" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -d '{"updates": {"wazn": {"value": "فَعَلَ", "approve": true}}}' \
     "http://localhost:5001/api/update-validation/word/1"

# Result:
# - wazn_validated_count STILL = 1 (not incremented)
# - No new Approval node created
# - IP protection working correctly
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

### Save Changes Workflow
1. **User Edits**: Types in field → `pendingUpdates` tracks change → "Save Changes" appears
2. **User Approves**: Clicks 👍 button → approval added to `pendingUpdates` 
3. **User Saves**: Clicks "Save Changes" → all changes batched to `/update-validation`
4. **Backend Persists**: Updates Neo4j + creates Approval nodes + applies spam protection
5. **UI Updates**: Clears pending changes, shows success message, hides "Save Changes"

### Field States
- **Unlocked**: Editable input, 👍 button enabled
- **Locked**: Disabled input 🔒, 👍 button still enabled for additional votes
- **Changed**: "Save Changes" button appears until saved

## Security Features

### IP-Based Spam Protection (24-hour cooldown)
```cypher
// Spam check query:
MATCH (n)-[:APPROVED_BY]->(approval:Approval)
WHERE id(n) = $nodeId 
AND approval.field = $fieldName 
AND approval.ip = $ip 
AND approval.timestamp > datetime() - duration('PT24H')
RETURN approval LIMIT 1

// If found: Skip approval (prevents spam)
// If not found: Create new approval
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

**Processing Logic:**
1. Validate node type and find node
2. **Sequential Processing** (avoid transaction conflicts):
   - Update field values: `SET n.fieldName = $value`
   - Check IP spam protection for approvals
   - Create Approval nodes: `CREATE (n)-[:APPROVED_BY]->(approval:Approval {...})`
   - Increment counters: `SET n.fieldName_validated_count = COALESCE(n.fieldName_validated_count, 0) + 1`
3. Return updated node data

**Response:**
```json
{
  "success": true,
  "message": "Updated 2 fields",
  "nodeData": { /* complete updated node */ }
}
```

## Field Priority Order

Properties displayed in Node Inspector:
1. **arabic** - Source text
2. **wazn** - Morphological pattern (EDITABLE) 
3. **english** - English translation (EDITABLE)
4. **spanish** - Spanish translation (EDITABLE)
5. **urdu** - Urdu translation (EDITABLE)
6. **transliteration** - Romanized form
7. **definitions** - Lane's Lexicon definitions
8. **hanswehr_entry** - Hans Wehr dictionary
9. **IDs** - word_id, root_id, entry_id, etc.
10. **Everything else** - Technical fields

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

# Check approval nodes
curl -X POST "http://localhost:5001/api/execute-query" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -H "Content-Type: application/json" \
     -d '{"query": "MATCH (n:Word)-[:APPROVED_BY]->(a:Approval) WHERE n.word_id = 1 RETURN n.arabic, a"}'
```

## Next Steps / Potential Enhancements

1. **Admin Panel**: View all approvals, manage spam IPs
2. **User Authentication**: Replace IP tracking with user accounts  
3. **Approval Thresholds**: Require N approvals before field is considered "validated"
4. **Rollback System**: Ability to revert field changes
5. **Batch Processing**: Approve multiple fields across multiple nodes
6. **Analytics**: Track approval patterns, popular fields, user contribution

---

**Last Updated**: August 30, 2025  
**Status**: ✅ Fully tested and functional  
**Commit**: `98d3377` - Complete backend validation system with Save Changes