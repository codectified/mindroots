# 🧠 MindRoots Codebase Reference

**Claude's streamlined guide to the MindRoots Arabic morphology application**

---

## 📚 **Documentation Index**

**IMPORTANT**: Always check organized documentation first. This file is just an index.

### **📁 Core Documentation**
- **[Complete Documentation Index](docs/DOCUMENTATION-INDEX.md)** - Master navigation guide
- **[Linguistics Features](docs/features/linguistics/)** - Arabic morphology app features
- **[Workspace Features](docs/features/workspace/)** - Multi-tenant workspace platform features
- **[Testing Procedures](docs/testing/)** - Test suites and verification steps
- **[Archived Documentation](docs/archived/)** - Historical/completed features

### **🔑 Current Production Features — Linguistics**
- **[Corpus Navigation System](docs/features/linguistics/CORPUS-NAVIGATION-SYSTEM.md)** - ✅ Fixed navigation with global_position
- **[Node Inspector](docs/features/linguistics/NODE-INSPECTOR-DOCUMENTATION.md)** - ✅ Inspector hub, custom tagger, ayah inspection via corpus reader
- **[Validation System](docs/features/linguistics/VALIDATION-SYSTEM-DOCUMENTATION.md)** - ✅ Inline editing and approval workflow
- **[Radical Search Integration](docs/features/linguistics/RADICAL-SEARCH-INTEGRATION.md)** - ✅ RadicalPosition-based search
- **[Analysis Nodes](docs/features/linguistics/ANALYSIS-NODES-DOCUMENTATION.md)** - ✅ LLM-generated linguistic analysis

### **🔑 Current Production Features — Workspace**
- **[Workspace Module](docs/features/workspace/WORKSPACE-MODULE-DOCUMENTATION.md)** - ✅ Multi-tenant creative workspace with asset upload + master agent support (⚠ ChatGPT sandbox upload gap — file_id support pending)
- **[Observability & Notion Projection](docs/features/workspace/OBSERVABILITY-NOTION-PROJECTION.md)** - 🔧 Neo4j metrics backend + Notion data_sources API ready, pending Notion credentials

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
    ├── workspace.js              # Multi-tenant creative workspace (Custom GPT)
    ├── observability.js          # Neo4j metrics + Notion projection layer
    └── [other modules]           # Feature-specific endpoints

workspaces/                       # Tenant asset + project storage (gitignored except _shared/)
├── aif/                          # AIF tenant
├── cicit/                        # CICIT tenant
├── mindroots/                    # MindRoots branding tenant
└── _shared/                      # Shared fonts + icons (tracked in git)

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
1. **Git workflow**: Commit and push from local Mac first
2. **API switching**: Comment localhost, uncomment production in apiService.js
3. **Deploy**: Run `./deploy-prod.sh` locally — builds on Mac, rsyncs to server (no server memory constraint)
4. **Test**: Verify with production API key

### **Common Commands**
```bash
# Test API endpoints
curl "http://localhost:5001/api/[endpoint]" -H "Authorization: Bearer [key]"

# Deploy (run from local Mac)
./deploy-prod.sh                    # frontend only
./deploy-prod.sh --restart-backend  # also restarts pm2

# Server management (via SSH)
ssh -i ~/Downloads/Development_Code/wp.pem bitnami@theoption.life
pm2 restart mindroots-backend
node server.js  # Start fresh server (dev)
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
- **Memory Builds**: Build runs locally on Mac and is rsynced — server never runs webpack
- **API Limits**: Most endpoints limit to 25 results
- **Force Simulation**: Avoid interrupting D3.js animations with duplicate API calls

---

## 🎯 **Current Status**

**Last Major Work**: Workspace + Observability overhaul (May 2026)
- ✅ Multi-tenant workspace: AIF, CICIT, MindRoots tenants provisioned
- ✅ Asset upload endpoint — agents upload images directly (no manual scp)
- ✅ Master workspace agent — admin/main key + `?workspace=<id>` accesses all tenants
- ✅ `GET /api/workspaces` lists all provisioned tenants
- ✅ OpenAPI specs in `docs/features/openapi-specs/` (tenant, master, linguistics)
- ✅ Observability backend (`observability.js`) — Neo4j metrics + Notion upsert on `data_sources` API (v2025-09-03)
- ✅ Frontend overhaul: Tailwind CSS, graph viewport fix (`calc(100vh - 160px)`)
- 🔧 Notion projection pending: add `NOTION_TOKEN` + `NOTION_DATABASE_ID` to `.env`

**Previous work**: Corpus Navigation System (October 2025), Frontend overhaul PR #58 (May 2026)

---

**💡 Remember**: This file is just an index. For detailed implementation info, always check the organized documentation in `docs/`

**Last Updated**: May 2026  
**File Purpose**: Streamlined index and quick reference only

---

## Shared HQ infrastructure: ChatGPT-export knowledge base

*(Added 2026-07-27 by HQ's ceo/ role — see C:\dev\hq\ceo\CLAUDE.md's
infrastructure-pattern exception for why HQ is allowed to add this section.)*

A local Elasticsearch index over ~2 years of Omar's ChatGPT conversation
history is running at `http://127.0.0.1:9200` (index `chatgpt-export`,
2,582 conversations, full text). It includes a `gpt_project_label` field —
`mindroots-family` is a high-confidence label covering conversations from
three dedicated custom GPTs Omar used for this project's research and
engineering. Query it for historical context, early design rationale, or
past decisions:

```bash
curl -s -X POST http://127.0.0.1:9200/chatgpt-export/_search \
  -H "Content-Type: application/json" \
  -d '{"query": {"bool": {"must": [{"match": {"full_text": "YOUR QUERY"}}],
       "filter": [{"term": {"gpt_project_label": "mindroots-family"}}]}},
       "size": 5, "_source": ["title", "create_date"]}'
```

Full docs: `C:\dev\chatgpt-export\README.md`. Not authoritative — cross-check
findings against this repo's own git history and `docs/`.