# 🧠 MindRoots Codebase Reference

**Claude's streamlined guide to the MindRoots Arabic morphology application**

---

## 📚 **Documentation Index**

**IMPORTANT**: Always check organized documentation first. This file is just an index.

### **📁 Core Documentation**
- **[Complete Documentation Index](docs/DOCUMENTATION-INDEX.md)** - Master navigation guide
- **[Features Documentation](docs/features/)** - All feature implementations
- **[Testing Procedures](docs/testing/)** - Test suites and verification steps
- **[Archived Documentation](docs/archived/)** - Historical/completed features

### **🔑 Current Production Features**
- **[Corpus Navigation System](docs/features/CORPUS-NAVIGATION-SYSTEM.md)** - ✅ Fixed navigation with global_position
- **[Validation System](docs/features/VALIDATION-SYSTEM-DOCUMENTATION.md)** - ✅ Inline editing and approval workflow
- **[Radical Search Integration](docs/features/RADICAL-SEARCH-INTEGRATION.md)** - ✅ RadicalPosition-based search
- **[Analysis Nodes](docs/features/ANALYSIS-NODES-DOCUMENTATION.md)** - ✅ LLM-generated linguistic analysis

---

## 🏗️ **Quick Architecture Reference**

### **Tech Stack**
- **Frontend**: React + Context API (port 3000)
- **Backend**: Express.js + Neo4j (port 5001)
- **Database**: Neo4j graph database
- **Visualization**: D3.js force simulation

### **Critical File Paths**
```
src/
├── components/graph/
│   ├── CorpusGraphScreen.js      # Main corpus navigation UI
│   ├── GraphVisualization.js     # D3.js graph rendering
│   └── Search.js                 # Root search interface
├── services/
│   └── apiService.js             # ALL API calls
└── contexts/                     # React state management

routes/
├── api.js                        # Main API router
└── modules/
    ├── inspection.js             # Node inspection & navigation
    └── [other modules]           # Feature-specific endpoints

server.js                         # Express server entry point
.env                             # Environment config (not in git)
```

### **🔧 Development Setup**
```bash
# Backend
node server.js                   # Runs on port 5001

# Frontend  
npm start                        # Runs on port 3000

# API Configuration
# Edit src/services/apiService.js to switch localhost/production
```

---

## 📋 **Development Workflow**

### **When Working on Features**
1. **Check [Documentation Index](docs/DOCUMENTATION-INDEX.md)** - find existing docs
2. **Read relevant feature docs** in `docs/features/`
3. **Create new feature docs** for substantial changes
4. **Update index** with new documentation

### **For Production Deployment**
1. **Git workflow**: Follow critical merge sequence (rebase master first)
2. **API switching**: Comment localhost, uncomment production in apiService.js
3. **Build**: Use memory flags for 1GB server constraint
4. **Test**: Verify with production API key

### **Common Commands**
```bash
# Test API endpoints
curl "http://localhost:5001/api/[endpoint]" -H "Authorization: Bearer [key]"

# Build with memory constraints
GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=400 npm run build

# Server management
pkill -f "node server.js"  # Kill running servers
node server.js             # Start fresh server
```

---

## ⚠️ **Critical Reminders**

### **Security**
- **API Keys**: Never commit keys to git, always use .env
- **Authentication**: All endpoints require Authorization header
- **Production Keys**: Use specific keys for frontend vs backend

### **Data Handling**
- **Neo4j Integers**: Always convert `{low: X, high: Y}` format
- **ID Formats**: Handle both integer and hierarchical IDs (`surah:ayah:word`)
- **Property Wrapping**: Extract from `{value: X, type: "string"}` format

### **Performance**
- **Memory Builds**: Frontend builds require memory flags on 1GB server
- **API Limits**: Most endpoints limit to 25 results
- **Force Simulation**: Avoid interrupting D3.js animations with duplicate API calls

---

## 🎯 **Current Status**

**Last Major Work**: Corpus Navigation System Overhaul (October 5, 2025)
- ✅ Fixed navigation getting stuck after one move
- ✅ Implemented global_position navigation for Quran
- ✅ Resolved animation interruption issues
- ✅ Production-ready and mobile-app ready

**Ready for**: Production deployment and mobile app development

---

**💡 Remember**: This file is just an index. For detailed implementation info, always check the organized documentation in `docs/`

**Last Updated**: October 5, 2025  
**File Purpose**: Streamlined index and quick reference only