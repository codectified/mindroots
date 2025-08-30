# 🧠 MindRoots Codebase Reference

**Claude's comprehensive guide to the MindRoots Arabic morphology application**

---

## 📁 **Core Architecture**

### **Frontend (React)**
- **Framework**: React with Context API for state management
- **Main Entry**: `src/App.js`
- **Port**: Default React dev server (usually 3000)
- **Key Libraries**: axios, D3.js for graph visualization

### **Backend (Express.js + Neo4j)**
- **Server**: `server.js` (runs on port 5001)
- **API Routes**: `routes/api.js` (main API endpoints)
- **Database**: Neo4j graph database
- **Authentication**: Environment variables in `.env`

### **🔧 Important Configuration**
```javascript
// src/services/apiService.js - API Base URL
const api = axios.create({
  baseURL: 'http://localhost:5001/api',  // LOCAL DEVELOPMENT
  // Production: 'https://theoption.life/api'
});
```

---

## 🏗️ **Key File Paths & Structure**

### **Critical Frontend Files**
```
src/
├── components/
│   ├── graph/
│   │   ├── Search.js                 # ROOT SEARCH UI (3 distinct buttons)
│   │   ├── GraphVisualization.js     # D3.js graph rendering
│   │   └── NodesTable.js            # Table view alternative
│   └── navigation/
│       ├── MiniMenu.js              # Settings & filters
│       └── Library.js               # Corpus selection
├── contexts/
│   ├── ScriptContext.js             # L1/L2 language settings
│   ├── FilterContext.js             # Node visibility filters
│   ├── FormFilterContext.js         # Form classification filters
│   └── GraphDataContext.js          # Graph state management
├── services/
│   └── apiService.js                # ALL API CALLS (critical file)
```

### **Critical Backend Files**
```
routes/
└── api.js                           # ALL API ENDPOINTS (1600+ lines)
server.js                            # Express server setup
.env                                 # Neo4j credentials (not in git)
```

### **Reference & Documentation**
```
RADICAL-SEARCH-INTEGRATION.md        # RadicalPosition implementation guide
backend-radical-search.js            # Backend endpoint templates
radical-search-tests.js              # Comprehensive test suite
CLAUDE.md                           # This file - your knowledge base!
```

---

## 🔍 **Root Search System (Recently Overhauled)**

### **Three Distinct Search Modes**

#### **1. Fetch Root(s) - Position-Specific Search**
- **Endpoint**: `GET /search-roots`
- **Frontend**: `fetchRoots(r1, r2, r3, L1, L2)`
- **Behavior**: Searches by exact radical position
- **Wildcards**: `*` = any radical, `None` = biradical only
- **Examples**:
  - `ا - * - None` → Biradical roots with ا in position 1
  - `ا - د - م` → Exact triradical match

#### **2. Combinate - Permutation-Based Search**
- **Endpoint**: `GET /search-combinate`
- **Frontend**: `fetchCombinateRoots(r1, r2, r3, L1, L2)`
- **Behavior**: Finds all permutations of specified radicals
- **Examples**:
  - `ا - د - *` → All permutations using ا and د

#### **3. Fetch Extended - 4+ Radical Roots Only**
- **Endpoint**: `GET /search-extended`
- **Frontend**: `fetchExtendedRootsNew(r1, r2, r3, L1, L2)`
- **Behavior**: Only quadriliteral+ roots
- **Constraint**: Never returns 2-3 radical roots

### **Legacy Support**
The original `/radical-search` endpoint still exists and powers older functionality. Legacy functions like `fetchGeminateRoots`, `fetchTriliteralRoots` are maintained for backward compatibility.

---

## 🗃️ **Database Structure (Neo4j)**

### **Key Node Types**
- **Root**: Arabic morphological roots (ا-د-م)
- **Word**: Lexical words derived from roots
- **Form**: Morphological patterns/frames
- **CorpusItem**: Words in specific texts (Quran, poetry)
- **RadicalPosition**: NEW - Flexible radical indexing layer

### **Critical Relationships**
- **Root** `[:HAS_RADICAL]` → **RadicalPosition** (NEW SYSTEM)
- **Root** `[:HAS_WORD]` → **Word**
- **Word** `[:HAS_FORM]` → **Form**
- **CorpusItem** `[:HAS_WORD]` → **Word**
- **Word** `[:ETYM]` → **Word** (etymological connections)

### **RadicalPosition Layer (Key Innovation)**
```cypher
// Example: Root ا-د-م has three RadicalPosition nodes
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->
  (:RadicalPosition {radical: "ا", position: 1})
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->
  (:RadicalPosition {radical: "د", position: 2})
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->
  (:RadicalPosition {radical: "م", position: 3})
```

### **Root Length Distribution**
- **0 x 2-radical roots** (stored as 3-radical with duplicates)
- **4,428 x 3-radical roots** (majority)
- **522 x 4-radical roots**
- **72 x 5-radical roots**
- **19 x 6-radical roots**
- **8 x 7-radical roots**

---

## 🎨 **Frontend Architecture Patterns**

### **Context Providers (State Management)**
```javascript
// Key contexts and their purposes
ScriptContext      // L1/L2 (Arabic/English) language settings
GraphDataContext  // Central graph data & node click handling
FilterContext     // Show/hide node types (words, forms, roots)
FormFilterContext // Form classification filters
DisplayModeContext // Graph vs Table view
```

### **API Service Pattern**
All backend communication goes through `src/services/apiService.js`:
```javascript
// Consistent error handling
try {
  const response = await api.get('/endpoint', { params });
  return convertIntegers(response.data); // Handle Neo4j integers
} catch (error) {
  console.error('Error description:', error);
  throw error;
}
```

### **Graph Visualization**
- **Library**: D3.js force simulation
- **File**: `src/components/graph/GraphVisualization.js`
- **Node Types**: Different colors/shapes for roots, words, forms
- **Interactive**: Click to expand, hover for info

---

## 📡 **API Endpoints Reference**

### **Root Search (New System)**
```javascript
// Three distinct search modes
GET /search-roots        // Position-specific with wildcards
GET /search-combinate    // Permutation-based
GET /search-extended     // 4+ radicals only

// Legacy (still functional)
GET /radical-search      // RadicalPosition unified search
GET /rootbyletters       // Old hardcoded system
GET /geminate-roots      // Biradical search
GET /triliteral-roots    // Triradical search
GET /extended-roots      // Extended roots
```

### **Graph Expansion**
```javascript
GET /expand/:sourceType/:sourceId/:targetType
// Examples:
// /expand/root/123/word     - Get words from root
// /expand/word/456/form     - Get forms from word
// /expand/corpusitem/789/word - Get words from corpus item
```

### **Corpus & Content**
```javascript
GET /list/corpora             // All available text corpora
GET /list/quran_items         // Quran verses by surah
GET /list/poetry_items        // Poetry text items
GET /expand/corpusitem/:id/word // Words in specific text
```

### **Dictionary & Definitions**
```javascript
GET /laneentry/:wordId        // Lane's Lexicon definitions
GET /hanswehrentry/:wordId    // Hans Wehr dictionary
GET /rootentry/:rootId        // Root-level definitions
```

---

## 🔧 **Development Setup**

### **Environment Configuration**
```bash
# Backend (.env file)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# Frontend (development)
npm start  # Usually runs on port 3000

# Backend
node server.js  # Runs on port 5001
```

### **Claude Permissions**
```json
// .claude/settings.local.json
{
  "permissions": {
    "allow": [
      "Bash(curl:*)",
      "Bash(find:*)", 
      "Bash(node server.js)",
      "Bash(pkill:*)",
      "Bash(rm:*)",
      "Bash(git checkout:*)",
      "Bash(git add:*)"
    ]
  }
}
```

---

## 🧪 **Testing & Debugging**

### **Test Suite**
- **File**: `radical-search-tests.js`
- **Usage**: `node radical-search-tests.js`
- **Coverage**: All search modes, edge cases, performance

### **Debug Queries**
```cypher
// Check RadicalPosition data
MATCH (rp:RadicalPosition) RETURN count(rp);

// Inspect root structure
MATCH (r:Root)-[:HAS_RADICAL]->(rp:RadicalPosition) 
RETURN r.arabic, collect(rp.radical) as radicals LIMIT 5;

// Count roots by length
MATCH (r:Root) 
WITH r, size([(r)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) as radical_count
RETURN radical_count, count(r) ORDER BY radical_count;
```

### **API Testing**
```bash
# Test endpoints with curl
curl "http://localhost:5001/api/search-roots?r1=ا&r2=*&r3=None&L1=arabic&L2=english"
curl "http://localhost:5001/api/search-combinate?r1=ا&r2=د&L1=arabic&L2=english"
curl "http://localhost:5001/api/search-extended?L1=arabic&L2=english"
```

---

## ⚠️ **Important Notes & Gotchas**

### **Neo4j Integer Handling**
```javascript
// Always convert Neo4j integers in API responses
const convertIntegers = (obj) => {
  // Handles Neo4j's {low: number, high: number} format
  if (typeof obj === 'object' && obj !== null) {
    if ('low' in obj && 'high' in obj) {
      return obj.low; // Convert to regular number
    }
    // ... recursive conversion
  }
  return obj;
};
```

### **Search Logic Edge Cases**
- **"NoR3" vs "None"**: Frontend uses "NoR3", backend expects "None"
- **Empty vs Wildcard**: Empty strings convert to "*" for wildcard matching
- **Biradical Reality**: No true 2-radical roots exist; biradicals are 3-radical with R3=R2

### **Performance Considerations**
- **Limit Queries**: Most endpoints limit to 25 results
- **Index Radicals**: RadicalPosition should be indexed on (radical, position)
- **Cache Frequent**: Consider caching common search patterns

### **UI/UX Patterns**
- **L1/L2 Display**: `L2 === 'off' ? root[L1] : \`${root[L1]} / ${root[L2]}\``
- **Node Labeling**: Always include root_id for unique identification
- **Error Handling**: Set empty graph data on errors: `{ nodes: [], links: [] }`

---

## 🚀 **Recent Major Changes**

### **Root Search Overhaul (Latest)**
- **Date**: Recent session
- **Impact**: Complete rework of search functionality
- **New Features**: 
  - Three distinct search modes with clear behaviors
  - Wildcard support (* for any radical)
  - "None" option for biradical-only searches
  - Position-specific vs permutation-based logic
- **Files Changed**: `Search.js`, `apiService.js`, `routes/api.js`

### **RadicalPosition Integration**
- **Purpose**: Replace hardcoded r1/r2/r3 fields with flexible layer
- **Benefits**: Support for variable-length roots, better search logic
- **Implementation**: New RadicalPosition nodes with HAS_RADICAL relationships

---

## 📚 **Learning Resources**

### **Arabic Morphology Context**
- **Roots**: Consonantal skeletons (ك-ت-ب = writing)
- **Forms**: Morphological patterns (فَعَلَ، فَاعِل، مَفْعُول)
- **Biradical**: Two-consonant roots (rare, often geminated)
- **Triradical**: Three-consonant roots (most common)
- **Extended**: Four+ consonant roots (quadriliteral, etc.)

### **Tech Stack Understanding**
- **Graph Databases**: Neo4j specializes in relationship-heavy data
- **React Contexts**: Avoid prop drilling, share state across components
- **D3.js**: Data-driven document manipulation for visualizations
- **Force Simulation**: Physics-based graph layout algorithm

---

## 🔮 **Future Considerations**

### **Potential Enhancements**
- **Search Analytics**: Track usage patterns for optimization
- **Advanced Patterns**: Support partial position matching
- **Caching Layer**: Redis for frequent searches
- **Mobile Responsive**: Touch-friendly graph interactions
- **Batch Operations**: Multiple root searches in one request

### **Technical Debt**
- **Legacy Endpoints**: Gradually migrate old hardcoded search logic
- **Error Handling**: More granular error messages
- **Type Safety**: Consider TypeScript migration
- **Test Coverage**: Unit tests for frontend components

---

*💡 **Pro Tip**: Always test both frontend and backend after changes. The graph visualization can be sensitive to data format changes, and Neo4j integer handling is a common source of bugs.*

**Last Updated**: After root search system overhaul and merge to master
**Status**: Production-ready with comprehensive search functionality
---

## 🔐 API Authentication System

### Security Implementation
- **Date Added**: August 12, 2025
- **Purpose**: Protect Neo4j database from bot attacks (31% malicious traffic)
- **Method**: Bearer token authentication

### Authentication Files
- middleware/auth.js - Authentication middleware
- routes/api.js - Protected endpoints (28+ routes)  
- src/services/apiService.js - Frontend auth headers
- .env - API_KEY storage (not in git)

### Implementation Details
All API routes protected with authenticateAPI middleware that validates Bearer tokens against API_KEY environment variable.

### Frontend Integration
apiService.js includes Authorization header with Bearer token for all requests to https://theoption.life/api

### Route Protection
Single middleware line protects all routes: router.use(authenticateAPI)

---

## 🔄 Git Workflow & Production Deployment

### Server Information
- **Host**: 34.228.180.221
- **User**: bitnami  
- **SSH Key**: /Users/omaribrahim/Downloads/wp.pem
- **App Directory**: /var/www/mindroots
- **Memory Constraint**: 1GB RAM (affects builds)

### CRITICAL Git Workflow
ALWAYS follow this sequence when merging feature branches:

1. git checkout master
2. git pull origin master  (CRITICAL - never skip\!)
3. git checkout feature-branch-name
4. git rebase master
5. git checkout master  
6. git merge feature-branch-name
7. git push origin master

### Memory-Constrained Builds
Frontend builds require: GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=400 npm run build

If build fails with memory errors:
1. sudo reboot (restart server to free memory)
2. Wait 2-3 minutes for services to restart  
3. Retry build command

### Post-Deployment Verification
After any changes:
1. git status (should be clean)
2. ls -la build/static/js/ (check build timestamp)
3. pm2 list (backend running)
4. Test API with curl + auth header

### Common Issues
- Frontend changes not appearing = outdated build timestamp
- Authentication failures = check API key matches in .env and apiService.js
- Memory build failures = use memory flags or restart server
- Git merge conflicts = forgot to git pull before merging

---

## 🎨 UI Overhaul & Validation System (August 30, 2025)

### Complete Interface Redesign
- **Branch**: `contextmenuoverhaul`
- **Purpose**: Streamlined user experience with integrated validation workflow
- **Status**: Production-ready, thoroughly tested

### Key Changes

#### **1. Context Menu Simplification**
- **Before**: Complex "Entries" submenu with multiple options
- **After**: Single "More info" action that opens InfoBubble
- **Files**: `src/components/graph/NodeContextMenu.js`
- **Result**: Cleaner, more intuitive right-click experience

#### **2. InfoBubble Enhancement**
- **Feature**: Collapsible sections for Lane, Hans Wehr, and Notes
- **Implementation**: HTML `<details>` elements with custom styling
- **Files**: `src/components/layout/InfoBubble.js`, `src/styles/info-bubble.css`
- **Mobile**: Responsive design with touch-friendly interactions

#### **3. Node Inspector Validation System**
- **Core Feature**: Inline editing for 6 linguistic fields
- **Editable Fields**: english, wazn, spanish, urdu, classification, transliteration
- **Workflow**: Edit → Approve → Lock → Continue approving
- **Backend**: Full persistence with spam protection

#### **4. Navigation System**
- **Arrow Navigation**: `←` and `→` buttons for Word and CorpusItem nodes
- **Backend**: Robust sequencing queries handle ID gaps gracefully
- **Position**: Located next to node ID in header for logical grouping
- **Contrast**: Dark buttons with white arrows for visibility

### Validation System Architecture

#### **Frontend State Management**
```javascript
// Three key state objects in NodeInspector:
fieldValues:     { wazn: "فَعَلَ", english: "to prepare" }
validationData:  { wazn: { validated_count: 3, locked: true } }
pendingUpdates:  { wazn: { value: "فَعَلَ", approve: true } }
```

#### **Backend Persistence**
- **Endpoint**: `POST /update-validation/:nodeType/:nodeId`
- **Database**: Updates node properties + creates Approval audit trail
- **Security**: IP-based 24-hour spam protection per field
- **Files**: `routes/api.js` (lines 2750-2862), `src/services/apiService.js`

#### **Database Schema (Tested)**
```cypher
// Updated node with validation counter
(:Word {
  wazn: "فَعَلَ",
  wazn_validated_count: 3,
  english: "to prepare oneself"
})

// Approval audit trail
-[:APPROVED_BY]->(:Approval {
  field: "wazn",
  ip: "192.168.1.1", 
  timestamp: datetime(),
  value: "فَعَلَ"
})
```

### Property Display Order
**Optimized for validation context:**
1. `arabic` - Source text for reference
2. `wazn` - Morphological pattern (EDITABLE 👍)
3. `english` - English translation (EDITABLE 👍)
4. `spanish` - Spanish translation (EDITABLE 👍)
5. `urdu` - Urdu translation (EDITABLE 👍)
6. `transliteration` - Romanization (EDITABLE 👍)
7. `definitions` - Lane's Lexicon context
8. `hanswehr_entry` - Hans Wehr context
9. **IDs** - word_id, root_id, etc.
10. **Technical fields** - Everything else

### User Experience Flow
1. **Context Menu**: Right-click → "More info" opens InfoBubble
2. **InfoBubble**: Click sections to expand Lane/Hans Wehr definitions
3. **Node Inspector**: "Inspect Node" shows full data with edit capabilities
4. **Edit Fields**: Type in editable fields → "Save Changes" appears
5. **Approve**: Click 👍 button → counter increments, field locks after first approval
6. **Navigate**: Use ← → arrows to browse through words/corpus items
7. **Save**: Click "Save Changes" → all updates persist to Neo4j database

### Testing Commands (Localhost)
```bash
# Test validation update
curl -X POST "http://localhost:5001/api/update-validation/word/16089" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -H "Content-Type: application/json" \
     -d '{"updates": {"wazn": {"value": "فَعَلَ", "approve": true}}}'

# Test navigation
curl "http://localhost:5001/api/navigate/word/16089/next" \
     -H "Authorization: Bearer localhost-dev-key-123"

# Check approval audit trail
curl -X POST "http://localhost:5001/api/execute-query" \
     -H "Authorization: Bearer localhost-dev-key-123" \
     -H "Content-Type: application/json" \
     -d '{"query": "MATCH (n:Word)-[:APPROVED_BY]->(a:Approval) WHERE n.word_id = 16089 RETURN a"}'
```

### Production Deployment Checklist
1. **Switch API URL**: Comment localhost, uncomment production in `apiService.js`
2. **Git Workflow**: Follow critical merge sequence (rebase master first!)
3. **Build**: Use memory flags for 1GB server constraint
4. **Test**: Verify validation system works with production API key
5. **Monitor**: Check pm2 logs for any approval/navigation errors

---

## 🔍 Node Inspector Feature (Legacy Documentation)

### Feature Overview
- **Date Added**: August 12, 2025
- **Purpose**: Comprehensive node inspection showing all properties, relationships, and connections
- **Access**: Context menu "Inspect Node" option available for all node types

### Implementation Details

#### Backend Endpoint
- **Route**: `GET /inspect/:nodeType/:nodeId`
- **File**: `routes/api.js`
- **Functionality**: Returns comprehensive node data including:
  - All node properties with types and formatting
  - All relationships (incoming/outgoing) with counts  
  - Connected node type summaries
  - Raw data for advanced users

#### Frontend Integration
- **API Service**: `inspectNode()` function in `src/services/apiService.js`
- **Context Menu**: "Inspect Node" option added to all node types in `NodeContextMenu.js`
- **UI Component**: `NodeInspector.js` - Full-screen modal with comprehensive data display
- **Styles**: Consolidated into `src/styles/info-bubble.css` (not separate stylesheet)

#### Key Features
- **Summary Dashboard**: Total properties, relationships, connected nodes
- **Properties Table**: All node properties with type-specific formatting and color coding
- **Relationships Overview**: Directional relationships with counts and badges
- **Connected Node Types**: Visual grid showing connected node type distribution
- **Raw Data Viewer**: Collapsible JSON view for advanced inspection
- **Mobile Responsive**: Optimized layout for mobile devices

#### Technical Implementation
```javascript
// Context action handler in GraphDataContext.js
case 'inspect':
  const inspectNodeId = node.word_id || node.root_id || node.form_id || node.item_id;
  const inspectionData = await inspectNode(node.type, inspectNodeId);
  setNodeInspectorData(inspectionData);
```

#### Styling Consolidation Notes
- **Previous**: Separate `node-inspector.css` file
- **Current**: Consolidated into existing `info-bubble.css` file
- **Reason**: Reduce file proliferation, reuse existing modal patterns
- **Button Styles**: Uses existing button classes from `buttons.css`

### Testing Requirements

#### Backend Testing
```bash
# Must restart backend after adding new endpoint
node server.js

# Test the inspect endpoint
curl "http://localhost:5001/api/inspect/root/123"
curl "http://localhost:5001/api/inspect/word/456" 
curl "http://localhost:5001/api/inspect/form/789"
```

#### Frontend Testing
1. **Switch to localhost**: Comment production API URL, uncomment localhost in `apiService.js`
2. **Restart backend**: New endpoint requires server restart
3. **Test all node types**: Right-click any node → "Inspect Node"
4. **Verify UI components**: Summary, properties, relationships, connected nodes
5. **Test mobile responsiveness**: Check layout on mobile devices
6. **Close functionality**: Both X button and footer close button

#### Development Workflow Notes
- **API URL Switch**: Always switch `apiService.js` to localhost for testing
- **Authentication Setup**: Localhost requires auth header with development key
- **Backend Restart**: Required when adding new endpoints or environment changes
- **Style Consolidation**: Prefer existing stylesheets over new ones
- **Button Consistency**: Use existing button patterns for UI consistency

#### Authentication Configuration
```javascript
// localhost development setup in apiService.js
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Authorization': 'Bearer localhost-dev-key-123',
  },
});

// production setup (commented out for localhost testing)
// const api = axios.create({
//   baseURL: 'https://theoption.life/api',
//   headers: {
//     'Authorization': 'Bearer [LEGACY_API_KEY]',
//   },
// });
```

#### Required .env Variables for Localhost
```bash
# Neo4j database connection
NEO4J_URI=neo4j+s://your-database.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# API authentication (required for auth middleware)
API_KEY=localhost-dev-key-123
```

#### Legacy Type Cleanup (August 12, 2025)
**Important**: Removed all legacy 'name' type references from codebase. Corpus items now consistently use 'corpusitem' type throughout:

**Files Updated**:
- `GraphVisualization.js`: Updated D3 color scales and force simulation positioning
- `CorpusGraphScreen.js`: Updated corpus item node detection
- `GraphDataContext.js`: Updated prefetch logic and removed type mapping
- `NodeContextMenu.js`: Updated context menu case statement
- `nodeColoring.js`: Updated color domain mapping
- `routes/api.js`: Updated backend type validation mapping

**Database Reality**: Corpus items in Neo4j have always been labeled as 'CorpusItem' nodes, not 'name' nodes. The 'name' references were legacy artifacts in the frontend code that needed cleanup.

