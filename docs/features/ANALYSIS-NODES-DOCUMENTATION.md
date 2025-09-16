# Analysis Nodes Feature Documentation

**Date Added**: September 12, 2025  
**Status**: Production-Ready ✅  
**Impact**: Enhanced "More Info" functionality with LLM-generated linguistic analysis

---

## Overview

The Analysis Nodes feature provides LLM-generated linguistic analysis for Arabic morphological roots. Analysis data is stored in dedicated Neo4j nodes connected to Root nodes via `HAS_ANALYSIS` relationships, enabling versioned linguistic insights while maintaining data integrity.

## Database Architecture

### Node Structure
```cypher
(:Root {arabic: "ا-د-م"})-[:HAS_ANALYSIS]->(:Analysis {
  // v2 Core Fields
  concrete_origin: "Physical act of preparation",
  path_to_abstraction: "From physical readiness to mental/spiritual preparation",
  fundamental_frame: "Framework of becoming ready or suitable",
  basic_stats: "Common in Quranic contexts, moderate frequency",
  
  // v2 Reference Fields  
  quranic_refs: "References to Quranic usage patterns",
  hadith_refs: "Hadith literature examples",
  poetic_refs: "Classical poetry references",
  proverbial_refs: "Proverbial and idiomatic usage",
  
  // Legacy v1 Fields (Backward Compatibility)
  lexical_summary: "Comprehensive lexical overview",
  semantic_path: "Evolution of semantic meaning",
  words_expressions: "Derived words and expressions",
  poetic_references: "Legacy poetic references field",
  
  // Metadata
  version: 2,
  timestamp: datetime()
})
```

### Schema Evolution

#### **v2 Schema (Current)**
**Core Analysis Fields:**
- `concrete_origin` - Physical/concrete root meaning
- `path_to_abstraction` - Semantic evolution pathway  
- `fundamental_frame` - Underlying conceptual framework
- `basic_stats` - Usage statistics and frequency

**Reference Fields:**
- `quranic_refs` - Quranic usage patterns
- `hadith_refs` - Hadith literature examples
- `poetic_refs` - Classical poetry references
- `proverbial_refs` - Proverbial and idiomatic usage

#### **v1 Schema (Legacy Support)**
- `lexical_summary` - General lexical overview
- `semantic_path` - Semantic development
- `words_expressions` - Derived vocabulary
- `poetic_references` - Poetry examples (legacy field name)

## API Endpoints

### Read Analysis Data
```javascript
GET /analysis/:nodeType/:nodeId

// Examples:
GET /analysis/root/123        // Fetch analysis for root 123
GET /analysis/word/456        // Future: word-level analysis

// Response:
{
  "analyses": [
    {
      "concrete_origin": "Physical preparation",
      "path_to_abstraction": "Mental readiness",
      "fundamental_frame": "Readiness framework", 
      "basic_stats": "Common usage",
      "quranic_refs": "Quranic examples",
      "hadith_refs": "Hadith examples",
      "poetic_refs": "Poetry examples",
      "proverbial_refs": "Proverbial usage",
      "version": 2,
      "timestamp": "2025-09-12T..."
    }
  ]
}
```

### Write Analysis Data
```javascript
POST /write-root-analysis

// Request Body (v2 Schema):
{
  "rootId": 123,
  "analysis": {
    // v2 Core Fields
    "concrete_origin": "Physical preparation",
    "path_to_abstraction": "Mental readiness", 
    "fundamental_frame": "Readiness framework",
    "basic_stats": "Common usage",
    
    // v2 Reference Fields
    "quranic_refs": "Quranic examples",
    "hadith_refs": "Hadith examples",
    "poetic_refs": "Poetry examples", 
    "proverbial_refs": "Proverbial usage"
  }
}

// Legacy v1 Request (Still Supported):
{
  "rootId": 123,
  "analysis": {
    "lexical_summary": "Comprehensive overview",
    "semantic_path": "Semantic evolution",
    "words_expressions": "Derived vocabulary",
    "poetic_references": "Poetry examples"
  }
}
```

## Frontend Implementation

### GraphDataContext Integration
**File**: `src/contexts/GraphDataContext.js`

```javascript
case 'more-info':
  try {
    let nodeInfoData = {};
    
    // Copy relevant properties from node
    if (node.definitions) nodeInfoData.definitions = node.definitions;
    if (node.hanswehr_entry) nodeInfoData.hanswehr_entry = node.hanswehr_entry;
    if (node.meaning) nodeInfoData.meaning = node.meaning;
    if (node.entry) nodeInfoData.entry = node.entry;
    
    // Fetch analysis data for root nodes
    if (node.type === 'root' && !nodeInfoData.analyses) {
      const analysisData = await fetchAnalysisData('root', nodeId);
      if (analysisData?.analyses?.length > 0) {
        nodeInfoData.analyses = analysisData.analyses;
      }
    }
    
    setInfoBubbleData(nodeInfoData);
    setShowInfoBubble(true);
  } catch (error) {
    console.error('Error fetching more info:', error);
  }
  break;
```

### InfoBubble Display Component
**File**: `src/components/layout/InfoBubble.js`

#### Version Management
- **Latest Analysis**: Always visible and expanded
- **Previous Versions**: Collapsible "Previous Versions (N)" section
- **Auto-Expansion**: Single section auto-expands when it's the only available data

#### Dual Schema Rendering
```javascript
const renderAnalysis = (analysis, isOlder = false) => (
  <div className="analysis-entry">
    {/* v2 Core Fields */}
    {analysis.concrete_origin && (
      <div className="analysis-section">
        <h4>Concrete Origin</h4>
        <p>{analysis.concrete_origin}</p>
      </div>
    )}
    {analysis.path_to_abstraction && (
      <div className="analysis-section">
        <h4>Path to Abstraction</h4>
        <p>{analysis.path_to_abstraction}</p>
      </div>
    )}
    
    {/* v2 Reference Fields */}
    {analysis.quranic_refs && (
      <div className="analysis-section">
        <h4>Qur'anic References</h4>
        <p>{analysis.quranic_refs}</p>
      </div>
    )}
    
    {/* Legacy v1 Fields (Backward Compatibility) */}
    {analysis.lexical_summary && (
      <div className="analysis-section">
        <h4>Lexical Summary</h4>
        <p>{analysis.lexical_summary}</p>
      </div>
    )}
    
    {/* Version Metadata */}
    {analysis.version && (
      <div className="analysis-meta">
        <small>
          {isOlder ? `Previous Version: ${analysis.version}` : `Version: ${analysis.version}`}
        </small>
      </div>
    )}
  </div>
);
```

### API Service Function
**File**: `src/services/apiService.js`

```javascript
export const fetchAnalysisData = async (nodeType, nodeId) => {
  try {
    const response = await api.get(`/analysis/${nodeType}/${nodeId}`);
    return convertIntegers(response.data);
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    throw error;
  }
};
```

## Data Source Integration

The "More Info" functionality integrates five distinct data sources:

1. **Lane's Lexicon**: `definitions` property - Classical Arabic dictionary entries
2. **Hans Wehr**: `hanswehr_entry` property - Modern Arabic-English dictionary
3. **Proto-Semitic Gloss**: `meaning` property - Etymological proto-language meanings
4. **Analysis**: From Analysis nodes - LLM-generated linguistic analysis
5. **Entry**: `entry` property - Additional lexical entries

## Styling and UX

### CSS Classes
**File**: `src/styles/info-bubble.css`

```css
.analysis-entry {
  margin-bottom: 15px;
}

.analysis-section {
  margin-bottom: 10px;
}

.analysis-section h4 {
  margin: 0 0 5px 0;
  font-weight: 600;
  color: #2c3e50;
}

.analysis-meta {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ecf0f1;
}

.older-versions-section {
  margin-top: 15px;
}

.version-separator {
  margin: 15px 0;
  border: none;
  border-top: 1px solid #bdc3c7;
}
```

### Auto-Expansion Logic
```javascript
// Count available sections to determine if only one exists
const availableSections = [
  nodeData.definitions,
  nodeData.hanswehr_entry, 
  nodeData.meaning,
  nodeData.analyses && nodeData.analyses.length > 0,
  nodeData.entry
].filter(Boolean);

const shouldAutoExpand = availableSections.length === 1;

// Apply to each section
<details className="info-section" open={shouldAutoExpand}>
  <summary>Analysis</summary>
  <div className="info-content">
    {/* Analysis content */}
  </div>
</details>
```

## Authentication

### API Key Requirements
- **Public API Key**: Required for reading analysis data
- **Environment**: Uses `PUBLIC_API_KEY` from environment variables
- **Security**: Read-only access, write operations require admin key

### Configuration
```javascript
// .env configuration
PUBLIC_API_KEY=9f43a3e526851607eea172265557c15b4b4a3654f61cb3b097a134c27de04f7c

// API service configuration  
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://theoption.life/api'
    : 'http://localhost:5001/api',
  headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_PUBLIC_API_KEY}`,
  },
});
```

## Testing and Validation

### Local Testing
```bash
# Start backend with analysis endpoint
node server.js

# Test analysis data retrieval
curl "http://localhost:5001/api/analysis/root/123" \
     -H "Authorization: Bearer localhost-dev-key-123"

# Test analysis data writing
curl -X POST "http://localhost:5001/api/write-root-analysis" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -H "Content-Type: application/json" \
     -d '{"rootId": 123, "analysis": {"concrete_origin": "test"}}'
```

### Production Testing
```bash
# Test production analysis endpoint
curl "https://theoption.life/api/analysis/root/123" \
     -H "Authorization: Bearer 9f43a3e526851607eea172265557c15b4b4a3654f61cb3b097a134c27de04f7c"
```

### Frontend Testing Checklist
1. ✅ Right-click any root node → "More info"
2. ✅ Verify analysis section appears (if data exists)
3. ✅ Check latest version is always expanded
4. ✅ Verify older versions are collapsible
5. ✅ Test auto-expansion when only one section available
6. ✅ Verify both v1 and v2 schema fields display correctly
7. ✅ Test with nodes that have no analysis data

## Production Deployment

### Deployment Steps
1. **Update production code**: Git pull latest changes
2. **Restart backend**: PM2 restart to pick up new endpoints
3. **Verify endpoints**: Test analysis endpoint with production API key
4. **Frontend deployment**: Build and deploy React application
5. **End-to-end testing**: Verify full "More info" functionality

### Production Verification
```bash
# SSH to production server
ssh -i "/path/to/wp.pem" bitnami@34.228.180.221

# Pull latest code
cd /var/www/mindroots && git pull origin master

# Restart backend
pm2 restart mindroots-backend

# Check logs
pm2 logs mindroots-backend
```

## Future Enhancements

### Planned Features
- **Word-Level Analysis**: Extend analysis to Word nodes
- **Form-Level Analysis**: Morphological pattern analysis
- **Batch Analysis**: Multiple root analysis in single request
- **Analysis Search**: Search through analysis content
- **Export Functionality**: Export analysis data for research

### Technical Improvements
- **Caching**: Cache frequent analysis queries
- **Versioning**: Enhanced version comparison UI
- **Mobile UX**: Touch-optimized collapsible sections
- **Keyboard Navigation**: Arrow keys for section navigation

## Troubleshooting

### Common Issues

#### **Analysis Data Not Appearing**
- **Check**: Backend endpoint `/analysis/root/:rootId` returns data
- **Verify**: API key authorization in browser network tab
- **Debug**: Console logs in GraphDataContext.js 'more-info' handler

#### **Version Display Issues**
- **Check**: Analysis nodes have `version` property set
- **Verify**: InfoBubble sorting logic (descending by version)
- **Debug**: Browser console for analysis array structure

#### **Auto-Expansion Not Working**
- **Check**: `shouldAutoExpand` logic counts sections correctly
- **Verify**: HTML `<details>` elements have `open` attribute when appropriate
- **Debug**: Console log `availableSections.length` value

#### **Authentication Failures**
- **Local**: Verify `localhost-dev-key-123` in .env
- **Production**: Verify PUBLIC_API_KEY matches production environment
- **Network**: Check browser network tab for 401/403 responses

---

**Last Updated**: September 12, 2025  
**Implementation Status**: Complete with v2 schema support  
**Production Status**: Deployed and operational  
**See Also**: [Root Search System](RADICAL-SEARCH-INTEGRATION.md), [Validation System](VALIDATION-SYSTEM-DOCUMENTATION.md)