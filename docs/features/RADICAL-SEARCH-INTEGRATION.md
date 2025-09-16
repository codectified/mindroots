# Radical Search Integration Documentation

**Date Added**: September 2025  
**Status**: Production-Ready ✅  
**Impact**: Complete search system overhaul with RadicalPosition-based architecture

---

## Overview

The Radical Search Integration replaces the legacy hardcoded search system with a flexible RadicalPosition-based architecture. This enables variable-length root searches, wildcard support, and position-specific vs permutation-based search logic.

## Architecture Evolution

### **Legacy System (Deprecated)**
- **Storage**: Hardcoded `r1`, `r2`, `r3` properties on Root nodes
- **Limitations**: Fixed 3-radical assumption, no wildcard support
- **Endpoints**: `/rootbyletters`, `/geminate-roots`, `/triliteral-roots`, `/extended-roots`

### **Modern RadicalPosition System** ✅ **PRODUCTION ACTIVE**
- **Storage**: Flexible RadicalPosition layer with HAS_RADICAL relationships
- **Benefits**: Variable-length roots, wildcard support, extensible search logic
- **Endpoints**: `/search-roots`, `/search-combinate`, `/search-extended`, `/radical-search`

## Database Structure

### **RadicalPosition Layer**
```cypher
// Example: Root ا-د-م has three RadicalPosition nodes
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->
  (:RadicalPosition {radical: "ا", position: 1})
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->
  (:RadicalPosition {radical: "د", position: 2})
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->
  (:RadicalPosition {radical: "م", position: 3})

// Legacy properties maintained for backward compatibility
(:Root {arabic: "ا-د-م", r1: "ا", r2: "د", r3: "م"})
```

### **Root Length Distribution**
- **4,428 x 3-radical roots** (majority)
- **522 x 4-radical roots**
- **72 x 5-radical roots**
- **19 x 6-radical roots**
- **8 x 7-radical roots**
- **Note**: No true 2-radical roots exist; biradicals are 3-radical with R3=R2

## API Endpoints

### **1. Position-Specific Search** `/search-roots`
**Purpose**: Exact position matching with wildcard support

```javascript
// Examples:
GET /search-roots?r1=ا&r2=*&r3=None&L1=arabic&L2=english
// → Biradical roots with ا in position 1

GET /search-roots?r1=ا&r2=د&r3=م&L1=arabic&L2=english  
// → Exact triradical match ا-د-م

GET /search-roots?r1=*&r2=د&r3=*&L1=arabic&L2=english
// → All roots with د in position 2
```

**Parameters**:
- `r1`, `r2`, `r3`: Radical positions (`*` for wildcard, `None` for biradical-only)
- `L1`, `L2`: Display languages (arabic, english, etc.)

**Neo4j Implementation**:
```cypher
MATCH (root:Root)
WHERE (
  $r1 = '*' OR 
  EXISTS((root)-[:HAS_RADICAL]->(:RadicalPosition {radical: $r1, position: 1}))
) AND (
  $r2 = '*' OR 
  EXISTS((root)-[:HAS_RADICAL]->(:RadicalPosition {radical: $r2, position: 2}))
) AND (
  $r3 = 'None' OR $r3 = '*' OR
  EXISTS((root)-[:HAS_RADICAL]->(:RadicalPosition {radical: $r3, position: 3}))
)
// Additional biradical filtering for r3='None'
RETURN root
LIMIT 25
```

### **2. Permutation-Based Search** `/search-combinate`
**Purpose**: Find all roots containing specified radicals in any positions

```javascript
// Examples:
GET /search-combinate?r1=ا&r2=د&L1=arabic&L2=english
// → All roots containing both ا and د in any positions
// Returns: ا-د-م, د-ا-ر, ا-د-ب, etc.

GET /search-combinate?r1=ك&r2=ت&r3=ب&L1=arabic&L2=english
// → All roots containing ك, ت, and ب in any order
```

**Logic**: Uses RadicalPosition nodes to find all permutations regardless of position

### **3. Extended Roots Only** `/search-extended`
**Purpose**: Filter for 4+ radical roots (quadriliteral, etc.)

```javascript
GET /search-extended?L1=arabic&L2=english
// → Only returns 4+ radical roots
```

**Implementation**: Counts RadicalPosition relationships and filters `>= 4`

### **4. Advanced RadicalPosition Engine** `/radical-search`
**Purpose**: JSON-based advanced query structure

```javascript
POST /radical-search
{
  "radicals": [
    {"radical": "ا", "position": 1},
    {"radical": "د", "position": 2}
  ],
  "searchType": "biradical_only",
  "L1": "arabic", 
  "L2": "english"
}
```

## Frontend Implementation

### **Search Component**
**File**: `src/components/graph/Search.js`

#### **Three Distinct Search Buttons**
```javascript
// Position-specific search
const handlePositionSearch = async () => {
  const data = await searchRoots(r1, r2, r3, L1, L2);
  setGraphData(data);
};

// Permutation-based search  
const handleCombinateSearch = async () => {
  const data = await searchCombinate(r1, r2, r3, L1, L2);
  setGraphData(data);
};

// Extended roots only
const handleExtendedSearch = async () => {
  const data = await searchExtended(L1, L2);
  setGraphData(data);
};
```

#### **Wildcard Logic**
```javascript
// Convert empty inputs to wildcards
const processSearchParams = (r1, r2, r3) => {
  return {
    r1: r1 || '*',
    r2: r2 || '*', 
    r3: r3 === 'NoR3' ? 'None' : (r3 || '*')
  };
};
```

### **API Service Functions**
**File**: `src/services/apiService.js`

```javascript
export const searchRoots = async (r1, r2, r3, L1, L2) => {
  try {
    const response = await api.get('/search-roots', {
      params: { r1: r1 || '*', r2: r2 || '*', r3: r3 || '*', L1, L2 }
    });
    return convertIntegers(response.data);
  } catch (error) {
    console.error('Error searching roots:', error);
    return { nodes: [], links: [] };
  }
};

export const searchCombinate = async (r1, r2, r3, L1, L2) => {
  try {
    const params = { L1, L2 };
    if (r1) params.r1 = r1;
    if (r2) params.r2 = r2;
    if (r3 && r3 !== 'NoR3') params.r3 = r3;
    
    const response = await api.get('/search-combinate', { params });
    return convertIntegers(response.data);
  } catch (error) {
    console.error('Error in combinate search:', error);
    return { nodes: [], links: [] };
  }
};
```

## Search Logic & Edge Cases

### **Wildcard Handling**
- **Empty Input**: Converts to `*` (any radical)
- **Explicit Wildcard**: User can enter `*` directly
- **Biradical Flag**: `None` in R3 position for biradical-only search

### **Frontend-Backend Mapping**
- **Frontend "NoR3"** → **Backend "None"** (biradical flag)
- **Frontend empty** → **Backend "*"** (wildcard)
- **Frontend explicit input** → **Backend exact match**

### **Performance Optimizations**
- **Query Limits**: 25 results per search to prevent overload
- **Index Strategy**: RadicalPosition should be indexed on `(radical, position)`
- **Caching**: Consider caching frequent search patterns

## Testing & Validation

### **Test Suite**
**File**: `radical-search-tests.js`

```bash
# Run comprehensive test suite
node radical-search-tests.js

# Tests cover:
# - All search modes (position, permutation, extended)
# - Wildcard variations
# - Biradical filtering
# - Edge cases and error handling
# - Performance benchmarks
```

### **Manual Testing Examples**
```bash
# Position-specific tests
curl "http://localhost:5001/api/search-roots?r1=ا&r2=*&r3=None&L1=arabic&L2=english"
curl "http://localhost:5001/api/search-roots?r1=ا&r2=د&r3=م&L1=arabic&L2=english"

# Permutation tests
curl "http://localhost:5001/api/search-combinate?r1=ا&r2=د&L1=arabic&L2=english"

# Extended roots test
curl "http://localhost:5001/api/search-extended?L1=arabic&L2=english"
```

## Proposed Enhancements

### **🔤 Orthographical Normalization**

#### **Current Challenge**
RadicalPosition stores exact Arabic characters without normalization:
- User searches for `أ` but data contains `ا`
- User searches for `ة` but data contains `ت`

#### **Proposed Solution**
```javascript
const normalizeArabicLetter = (letter) => {
  const normalizationMap = {
    // Alef variants
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ء': 'ا',
    // Taa variants  
    'ة': 'ت',
    // Yaa variants
    'ى': 'ي',
    // Waw variants
    'ؤ': 'و'
  };
  return normalizationMap[letter] || letter;
};
```

#### **Implementation Strategy**
- **Input Normalization**: Normalize user input before queries
- **Backward Compatibility**: Maintain original values for linguistic analysis
- **Performance**: Pre-compute normalized indexes

## Legacy System Migration

### **Deprecated Endpoints** ⚠️
These endpoints use hardcoded `r1`, `r2`, `r3` properties:
- `/rootbyletters` - Basic hardcoded position search  
- `/geminate-roots` - Hardcoded biradical logic
- `/triliteral-roots` - Hardcoded triradical logic
- `/extended-roots` - Hardcoded extended logic

### **Migration Path**
1. **Phase 1**: New RadicalPosition endpoints in production ✅
2. **Phase 2**: Frontend updated to use new endpoints ✅
3. **Phase 3**: Legacy endpoints marked deprecated ✅
4. **Phase 4**: Remove legacy endpoints (future)

## Production Deployment

### **Database Schema Verification**
```cypher
// Check RadicalPosition data exists
MATCH (rp:RadicalPosition) RETURN count(rp);

// Inspect root structure
MATCH (r:Root)-[:HAS_RADICAL]->(rp:RadicalPosition) 
RETURN r.arabic, collect(rp.radical) as radicals LIMIT 5;

// Count roots by length
MATCH (r:Root) 
WITH r, size([(r)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) as radical_count
RETURN radical_count, count(r) ORDER BY radical_count;
```

### **Index Requirements**
```cypher
// Essential indexes for performance
CREATE INDEX IF NOT EXISTS FOR (rp:RadicalPosition) ON (rp.radical, rp.position);
CREATE INDEX IF NOT EXISTS FOR (r:Root) ON r.arabic;
```

### **Monitoring Points**
- **Query Performance**: Monitor RadicalPosition query times
- **Search Usage**: Track which search modes are most popular
- **Error Rates**: Watch for timeout errors on complex searches

## Troubleshooting

### **Common Issues**

#### **No Search Results**
- **Check**: RadicalPosition data exists for searched radicals
- **Verify**: Arabic input encoding (UTF-8)
- **Debug**: Console log search parameters before API call

#### **Slow Search Performance**
- **Check**: RadicalPosition indexes are created
- **Verify**: Query limits are applied (25 results)
- **Consider**: Normalization for frequent searches

#### **Wildcard Not Working**
- **Check**: Empty inputs convert to `*` in frontend
- **Verify**: Backend handles `*` wildcard in WHERE clauses
- **Debug**: Network tab to see actual API parameters

#### **Biradical Search Issues**
- **Check**: `NoR3` converts to `None` in backend
- **Verify**: Biradical filtering logic excludes 3+ radical roots
- **Remember**: No true 2-radical roots exist (use duplication pattern)

---

**Last Updated**: September 12, 2025  
**Implementation Status**: Complete and production-ready  
**Performance**: Optimized with proper indexing  
**See Also**: [Search Testing](../testing/RADICAL-SEARCH-TESTS.md), [Architecture Overview](../CLAUDE.md#root-search-system)