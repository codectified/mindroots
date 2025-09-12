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

## 🔍 **Complete Root Search System Architecture (Recently Overhauled)**

### **Modern RadicalPosition-Based System** ✅ **PRODUCTION ACTIVE**

The search system uses a flexible RadicalPosition layer in Neo4j for optimal performance and extensibility.

#### **Database Structure**
```cypher
// RadicalPosition Layer (Flexible)
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->(:RadicalPosition {radical: "ا", position: 1})
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->(:RadicalPosition {radical: "د", position: 2})
(:Root {arabic: "ا-د-م"})-[:HAS_RADICAL]->(:RadicalPosition {radical: "م", position: 3})

// Legacy Properties (Backward Compatibility)
(:Root {arabic: "ا-د-م", r1: "ا", r2: "د", r3: "م"})
```

#### **Three Primary Search Endpoints**

##### **1. Position-Specific Search** `/search-roots`
```javascript
// Examples:
GET /search-roots?r1=ا&r2=*&r3=None&L1=arabic&L2=english
// → Biradical roots with ا in position 1

GET /search-roots?r1=ا&r2=د&r3=م&L1=arabic&L2=english  
// → Exact triradical match ا-د-م
```
- **Wildcards**: `*` (any radical), `None` (biradical only)
- **Logic**: Exact position matching with wildcard support
- **Neo4j**: Uses RadicalPosition relationships

##### **2. Permutation-Based Search** `/search-combinate`  
```javascript
// Examples:
GET /search-combinate?r1=ا&r2=د&L1=arabic&L2=english
// → All roots containing both ا and د in any positions
```
- **Behavior**: Finds all permutations regardless of position
- **Use Case**: "I know these radicals appear but not their positions"
- **Neo4j**: Flexible RadicalPosition matching

##### **3. Extended Roots Only** `/search-extended`
```javascript
// Examples: 
GET /search-extended?L1=arabic&L2=english
// → Only returns 4+ radical roots (quadriliteral, etc.)
```
- **Filter**: Automatically excludes 2-3 radical roots
- **Purpose**: Focus on complex morphological patterns
- **Count Constraint**: `size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) >= 4`

### **Advanced RadicalPosition Engine** `/radical-search` 
```javascript
// Advanced JSON-based query structure
POST /radical-search
{
  "radicals": [
    {"radical": "ا", "position": 1},
    {"radical": "د", "position": 2}
  ],
  "searchType": "biradical_only",
  "L1": "arabic", "L2": "english"
}
```

### **Legacy Endpoints** ⚠️ **DEPRECATED BUT FUNCTIONAL**

These endpoints use hardcoded `r1`, `r2`, `r3` properties and are marked for future migration:

- `/rootbyletters` - Basic hardcoded position search  
- `/geminate-roots` - Hardcoded biradical logic
- `/triliteral-roots` - Hardcoded triradical logic
- `/extended-roots` - Hardcoded extended logic

**Migration Path**: Legacy endpoints will eventually be removed in favor of RadicalPosition-based equivalents.

### **🔤 Orthographical Normalization (Recommended Enhancement)**

#### **Current Challenge**
RadicalPosition stores exact Arabic characters without normalization, leading to search misses:
- User searches for `أ` but data contains `ا`
- User searches for `ة` but data contains `ت`

#### **Proposed Normalization Rules**
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
    'ؤ': 'و',
    
    // Noon variants
    'ن': 'ن'
  };
  
  return normalizationMap[letter] || letter;
};
```

#### **Implementation Points**
- **Input Normalization**: Normalize user input before RadicalPosition queries
- **Data Normalization**: Consider normalizing RadicalPosition.radical values
- **Backward Compatibility**: Maintain original values for linguistic analysis
- **Performance**: Pre-compute normalized indexes for fast lookup

#### **Affected Endpoints**
All RadicalPosition-based search endpoints would benefit:
- `/search-roots` - Position-specific matching
- `/search-combinate` - Permutation matching  
- `/search-extended` - Extended root matching
- `/radical-search` - Advanced query engine

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

### **Hierarchical ID Integration (Latest)**
- **Date**: September 2025
- **Impact**: Support for Corpus 2's semantic `surah:ayah:word` ID format
- **Problem Solved**: Corpus 2 reindexing introduced hierarchical IDs that broke integer-based backend logic
- **Architecture Decision**: Mixed ID schema with conditional handling
- **Files Changed**: `routes/api.js` (expand/list endpoints), `CorpusRenderer.js` (sorting), `apiService.js`

### **Root Search Overhaul** 
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

### **Architectural Debt - Mixed ID Schema**
- **Current State**: Corpus 1&3 use integer IDs, Corpus 2 uses hierarchical IDs (`surah:ayah:word`)
- **Code Impact**: Conditional logic in backend queries, frontend sorting, ID generation
- **Maintenance Burden**: Every new corpus-related feature needs dual ID handling
- **Monitoring Points**: Watch for complexity growth, consider refactoring if pattern spreads
- **Alternative Approaches**: Legacy ID fields, full hierarchical migration, or Neo4j internal IDs

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

## 🐛 Mixed ID Schema Support

### Hierarchical vs Integer IDs
- **Corpus 1&3**: Use integer IDs (1, 2, 3...)
- **Corpus 2**: Uses hierarchical IDs (`surah:ayah:word`)
- **Solution**: Conditional logic in backend queries

### Key Implementation Pattern
```javascript
const isHierarchicalId = itemId.includes(':');
const query = isHierarchicalId ? 
  'MATCH (n {item_id: $itemId})' :  // String ID
  'MATCH (n {item_id: toInteger($itemId)})'; // Integer ID
```

### Navigation System
- **Integer Navigation**: Simple +1/-1 logic
- **Hierarchical Navigation**: Semantic surah:ayah:word ordering
- **UI**: `←` and `→` arrows in Node Inspector
- **Endpoint**: `/navigate/corpusitem/:corpusId/:itemId/:direction`

---

## 🔐 Dual API Key Security System (Latest)

### GPT Orchestration Security Implementation
- **Date Added**: September 12, 2025
- **Purpose**: Secure GPT integration with read-only and admin access control
- **Status**: ✅ IMPLEMENTED, TESTED, READY FOR PRODUCTION DEPLOYMENT

### Three-Tier Authentication System

#### **1. Original Production Key (Backward Compatibility)**
- **Usage**: Existing frontend (apiService.js) and all current endpoints
- **Access**: Full backward-compatible access to all existing routes

#### **2. Public API Key (MindRead GPT - Read-Only)**
- **Endpoint**: `POST /api/execute-query`
- **Restrictions**: Read-only operations (MATCH, RETURN, COUNT, etc.)
- **Blocks**: CREATE, DELETE, SET, MERGE, DROP operations

#### **3. Admin API Key (MindRoot GPT - Full Access)**
- **Endpoint**: `POST /api/admin-query`
- **Access**: Full read/write Neo4j operations
- **Enhanced**: Detailed operation metadata in responses

### Implementation Files
- **middleware/auth.js**: Dual key authentication with query sanitization
- **routes/api.js**: New `/execute-query`, `/admin-query`, and `/write-root-analysis` endpoints
- **.env**: Contains all API keys (not in git)
- **src/services/apiService.js**: Uses production API key

### Root Analysis Write Endpoint

#### **Specialized Endpoint**: `/api/write-root-analysis`
- **Purpose**: Creates structured Analysis nodes linked to Root nodes
- **Authentication**: Public GPT API key only (admin key rejected for security)
- **Method**: POST
- **Architecture**: Separate Analysis nodes with versioning and structured sections

#### **Request Format**
```json
{
  "rootId": "3",
  "lexical_summary": "عَذْبٌ — sweet, pleasant (especially of water, wine, or food)...",
  "semantic_path": "From physical sweetness to pleasantness of speech...",
  "fundamental_frame": "Union/separation: sweetness unites and soothes...",
  "words_expressions": "مُعَذَّبَةٌ — wine mixed with water...",
  "poetic_references": "On water: مَاءٌ عَذْبٌ — sweet water...",
  "basic_stats": "Total Word Nodes under ع-ذ-ب: 20+...",
  "version": 1
}
```

#### **Response Format**
```json
{
  "success": true,
  "message": "Analysis node created successfully",
  "rootId": 5,
  "arabic": "ا-ب-ض",
  "analysisId": "analysis_5_1757660897912",
  "version": 1,
  "timestamp": "2025-09-12T07:08:17.912Z",
  "sections": {
    "lexical_summary": true,
    "semantic_path": true,
    "fundamental_frame": true,
    "words_expressions": true,
    "poetic_references": true,
    "basic_stats": true
  }
}
```

#### **Analysis Node Schema**
```cypher
(:Root)-[:HAS_ANALYSIS]->(:Analysis {
  id: "analysis_123",
  version: 1,
  created: "2025-09-12T07:08:17.912Z",
  source: "gpt-analysis",
  user_edited: false,
  validation_status: "pending",
  
  // Structured sections
  lexical_summary: "Concrete origin analysis...",
  semantic_path: "Path to abstraction...",
  fundamental_frame: "Union/separation dynamics...",
  words_expressions: "Relevant words and expressions...",
  poetic_references: "Poetic and idiomatic usage...",
  basic_stats: "Statistical information..."
})
```

#### **Version Control Features**
- **Multiple Analyses**: Each root can have multiple Analysis nodes
- **Auto-Versioning**: Automatically increments version numbers
- **Historical Tracking**: All previous analyses preserved
- **User Editing**: `user_edited` flag tracks manual modifications
- **Validation Status**: `validation_status` for quality control

#### **GPT Usage Flow**
1. **Read Existing**: GPT queries existing analyses via `/execute-query`
2. **Build Incrementally**: GPT can reference previous analyses to avoid repetition
3. **Create New Version**: GPT calls `/write-root-analysis` with structured sections
4. **Track Progress**: Backend creates versioned Analysis node
5. **Future Enhancement**: User editing interface for Analysis nodes

#### **Structured Sections (Based on Example)**
- **lexical_summary**: Core meanings and concrete origins
- **semantic_path**: Pathway from concrete to abstract meanings
- **fundamental_frame**: Underlying semantic frameworks
- **words_expressions**: Related words and expressions
- **poetic_references**: Literary and idiomatic usage examples
- **basic_stats**: Quantitative analysis of the root's word family

#### **Security Features**
- Only public GPT API key accepted (admin key rejected)
- Root node existence validated before creating Analysis
- Hardcoded Cypher prevents arbitrary database operations
- Version control prevents data loss
- Separate nodes keep generated content isolated from core lexical data

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

## 🎨 UI & Validation System

### Key Features
- **Context Menu**: Simplified with "More info" action
- **InfoBubble**: Collapsible sections for definitions
- **Node Inspector**: Full node data with inline editing
- **Validation**: Edit → Approve → Lock workflow

### Validation System
- **Editable Fields**: english, wazn, spanish, urdu, classification, transliteration
- **Endpoint**: `POST /update-validation/:nodeType/:nodeId`
- **Security**: IP-based spam protection
- **Audit Trail**: Creates Approval nodes for tracking

### Navigation
- **Arrow Buttons**: `←` and `→` for Word and CorpusItem nodes
- **Location**: Next to node ID in inspector header
- **Endpoint**: `/navigate/:nodeType/:nodeId/:direction`
```bash
# Test validation update
curl -X POST "http://localhost:5001/api/update-validation/word/16089" \
     -H "Authorization: Bearer [DEV_KEY]" \
     -H "Content-Type: application/json" \
     -d '{"updates": {"wazn": {"value": "فَعَلَ", "approve": true}}}'
```

### Production Deployment Checklist
1. **Switch API URL**: Comment localhost, uncomment production in `apiService.js`
2. **Git Workflow**: Follow critical merge sequence (rebase master first!)
3. **Build**: Use memory flags for 1GB server constraint
4. **Test**: Verify validation system works with production API key
5. **Monitor**: Check pm2 logs for any approval/navigation errors

---

## 🔍 Node Inspector

### Overview
- **Purpose**: Comprehensive node inspection
- **Access**: Context menu "Inspect Node" option
- **Endpoint**: `GET /inspect/:nodeType/:nodeId`

### Features
- **Summary Dashboard**: Properties, relationships, connections count
- **Properties Table**: All node data with formatting
- **Relationships**: Directional with counts
- **Connected Nodes**: Visual grid by type
- **Raw Data**: Collapsible JSON view
- **Mobile Responsive**: Touch-friendly layout

### Technical Notes
- **Styles**: Consolidated into `info-bubble.css`
- **ID Extraction**: Uses `word_id || root_id || form_id || item_id`
- **Testing**: Requires backend restart for new endpoints
```javascript
// localhost development setup in apiService.js
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Authorization': 'Bearer [DEV_KEY]',
  },
});

// production setup (uses production API key from .env)
// const api = axios.create({
//   baseURL: 'https://theoption.life/api',
//   headers: {
//     'Authorization': 'Bearer [PROD_KEY]',
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
API_KEY=[your-dev-key]
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

---

## 📋 Documentation Standards

### File Organization
- **Features**: `docs/features/` - New feature documentation
- **Testing**: `docs/testing/` - Test procedures and results  
- **Archived**: `docs/archived/` - Historical/deployed features
- **Prototypes**: `docs/development-prototypes/` - Experimental code

### Documentation Rules
1. Check `DOCUMENTATION-INDEX.md` first
2. Update `CLAUDE.md` for architecture changes only
3. Create feature docs for substantial changes
4. Include implementation details, file paths, testing steps
5. Cross-reference related documents

---

*💡 **Pro Tip**: Always test both frontend and backend after changes. The graph visualization can be sensitive to data format changes, and Neo4j integer handling is a common source of bugs.*

*📋 **Documentation Tip**: Always check DOCUMENTATION-INDEX.md first when working on features - existing documentation can save hours of reverse-engineering.*

**Last Updated**: After documentation workflow establishment  
**Status**: Production-ready with comprehensive search functionality and organized documentation system

