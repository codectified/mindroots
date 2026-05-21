# MindRoots Documentation Index

**Last Updated**: May 2026
**Purpose**: Comprehensive navigation guide for all MindRoots documentation

---

## Quick Navigation

### Core Architecture & Setup
- **[CLAUDE.md](../CLAUDE.md)** — Main architecture reference and Claude's knowledge base
- **[README.md](../README.md)** — Project overview and getting started guide

### Frontend Design & Development
- **[Frontend Design Guide](FRONTEND-DESIGN-GUIDE.md)** — Frontend architecture, layout patterns, flexbox alignment, styling conventions, common pitfalls
- **[Component Patterns](COMPONENT-PATTERNS.md)** — Reusable component patterns, code examples, and best practices

---

## Feature Documentation

### Linguistics Branch (`docs/features/linguistics/`)

Arabic morphology graph features — corpus navigation, analysis, search, validation, and UI controls.

| Document | Status | Description |
|---|---|---|
| [Analysis Nodes](features/linguistics/ANALYSIS-NODES-DOCUMENTATION.md) | ✅ | LLM-generated linguistic analysis with v2 schema |
| [Corpus Navigation System](features/linguistics/CORPUS-NAVIGATION-SYSTEM.md) | ✅ | Sequential corpus browsing via `global_position` |
| [Validation System](features/linguistics/VALIDATION-SYSTEM-DOCUMENTATION.md) | ✅ | Inline editing and approval workflow for linguistic data |
| [Radical Search Integration](features/linguistics/RADICAL-SEARCH-INTEGRATION.md) | ✅ | RadicalPosition-based search system architecture |
| [Corpus Filter](features/linguistics/CORPUS-FILTER-DOCUMENTATION.md) | ✅ | Unified corpus scoping via `CorpusFilterContext` |
| [Surah Filter & Random Node Optimization](features/linguistics/SURAH-FILTER-DOCUMENTATION.md) | ✅ | Quran surah sub-filter + count+skip random node selection |
| [Corpus Count Annotation](features/linguistics/CORPUS-COUNT-ANNOTATION-DOCUMENTATION.md) | ✅ | Root/word nodes annotated with corpus occurrence counts |
| [Full-Text Search](features/linguistics/FULLTEXT-SEARCH-DOCUMENTATION.md) | ✅ | Lucene full-text search over Lane's Lexicon, English gloss, Arabic text |
| [Collapse Functionality](features/linguistics/COLLAPSE-FUNCTIONALITY.md) | ✅ | Node collapse/expand behavior |
| [Infobubble Positioning](features/linguistics/INFOBUBBLE-POSITIONING-GUIDE.md) | ✅ | Tooltip/infobubble positioning logic |
| [Font System](features/linguistics/FONT-SYSTEM.md) | ✅ | Dual Latin/Arabic font scale controls |
| [Typography Controls](features/linguistics/TYPOGRAPHY-CONTROL-DOCUMENTATION.md) | ✅ | Typography control UI documentation |
| [Mobile Development Readiness](features/linguistics/MOBILE-DEVELOPMENT-READINESS.md) | ✅ | Mobile adaptation status and approach |
| [GPT Root Analysis Reference](features/linguistics/GPT-ANALYSIS-REFERENCE.md) | ✅ | GPT workflow for creating morphological analysis nodes |

**Agent & API:**
- [MindRoots Linguistics Agent Instructions](features/linguistics/agent-instructions/MINDROOTS-AGENT-INSTRUCTIONS.md) — Semitic root analysis workflow and graph query patterns
- [MindRoots OpenAPI Spec](features/linguistics/openapi-specs/mindroots-openai-spec.yaml) — `execute-query` + `write-root-analysis` actions

---

### Workspace Branch (`docs/features/workspace/`)

Multi-tenant creative workspace platform — Custom GPT integration, asset management, graphic generation, observability.

| Document | Status | Description |
|---|---|---|
| [Workspace Module](features/workspace/WORKSPACE-MODULE-DOCUMENTATION.md) | ✅ | Full workspace API — versioned graphics, asset upload, PNG rendering |
| [Observability & Notion Projection](features/workspace/OBSERVABILITY-NOTION-PROJECTION.md) | 🔧 | Live Neo4j metrics + Notion projection layer — pending credentials |
| [GPT Orchestration Security](features/workspace/GPT-ORCHESTRATION-SECURITY.md) | ✅ | Security model for GPT-facing endpoints |

**Known gap**: `uploadAsset` does not support ChatGPT sandbox file references — see [Known Limitations](features/workspace/WORKSPACE-MODULE-DOCUMENTATION.md#known-limitations) in the workspace doc. `file_id` support planned.

**Agents & API:**
- [Tenant Workspace Agent Instructions](features/workspace/agent-instructions/CREATIVE-WORKSPACE-AGENT-INSTRUCTIONS.md) — Per-client GPT setup (`ws_*` token, single workspace)
- [Master Workspace Agent Instructions](features/workspace/agent-instructions/MASTER-WORKSPACE-AGENT-INSTRUCTIONS.md) — Cross-workspace master agent (admin/main key + `?workspace=<id>`)
- [Tenant Workspace OpenAPI Spec](features/workspace/openapi-specs/workspace-openapi-spec.yaml) — Tenant-scoped workspace actions
- [Master Workspace OpenAPI Spec](features/workspace/openapi-specs/master-workspace-openapi-spec.yaml) — All-tenant workspace actions

---

## Testing & Quality Assurance (`docs/testing/`)
- **[Backend Test Results](testing/BACKEND-TEST-RESULTS.md)** — API endpoint testing and validation results
- **[Frontend Integration Checklist](testing/FRONTEND-INTEGRATION-CHECKLIST.md)** — UI/UX testing procedures

## Deployment (`docs/deployment/`)
- **[GPT Orchestration Deployment Guide](deployment/GPT-ORCHESTRATION-DEPLOYMENT-GUIDE.md)** — GPT integration deployment steps

## Database Reference (`docs/neo4j/`)
- **[Neo4j Schema](neo4j/schema.md)** — Graph database schema reference

## Archived & Historical (`docs/archived/`)
- **[Backend Deduplication Fixes](archived/BACKEND-DEDUPLICATION-FIXES.md)** — Historical database optimization work

## Development Prototypes (`docs/development-prototypes/`)
- Unused code, experiments, and proof-of-concepts — see [README](development-prototypes/README.md)

---

## Directory Structure

```
docs/
├── DOCUMENTATION-INDEX.md          # This file
├── FRONTEND-DESIGN-GUIDE.md
├── COMPONENT-PATTERNS.md
├── features/
│   ├── linguistics/                # Arabic morphology app features
│   │   ├── ANALYSIS-NODES-DOCUMENTATION.md
│   │   ├── COLLAPSE-FUNCTIONALITY.md
│   │   ├── CORPUS-COUNT-ANNOTATION-DOCUMENTATION.md
│   │   ├── CORPUS-FILTER-DOCUMENTATION.md
│   │   ├── CORPUS-NAVIGATION-SYSTEM.md
│   │   ├── FONT-SYSTEM.md
│   │   ├── FULLTEXT-SEARCH-DOCUMENTATION.md
│   │   ├── GPT-ANALYSIS-REFERENCE.md
│   │   ├── INFOBUBBLE-POSITIONING-GUIDE.md
│   │   ├── MOBILE-DEVELOPMENT-READINESS.md
│   │   ├── RADICAL-SEARCH-INTEGRATION.md
│   │   ├── SURAH-FILTER-DOCUMENTATION.md
│   │   ├── TYPOGRAPHY-CONTROL-DOCUMENTATION.md
│   │   ├── VALIDATION-SYSTEM-DOCUMENTATION.md
│   │   ├── agent-instructions/
│   │   │   └── MINDROOTS-AGENT-INSTRUCTIONS.md
│   │   └── openapi-specs/
│   │       └── mindroots-openai-spec.yaml
│   └── workspace/                  # Multi-tenant workspace platform features
│       ├── WORKSPACE-MODULE-DOCUMENTATION.md
│       ├── GPT-ORCHESTRATION-SECURITY.md
│       ├── OBSERVABILITY-NOTION-PROJECTION.md
│       ├── agent-instructions/
│       │   ├── CREATIVE-WORKSPACE-AGENT-INSTRUCTIONS.md
│       │   └── MASTER-WORKSPACE-AGENT-INSTRUCTIONS.md
│       └── openapi-specs/
│           ├── workspace-openapi-spec.yaml
│           └── master-workspace-openapi-spec.yaml
├── testing/
│   ├── BACKEND-TEST-RESULTS.md
│   └── FRONTEND-INTEGRATION-CHECKLIST.md
├── deployment/
│   └── GPT-ORCHESTRATION-DEPLOYMENT-GUIDE.md
├── neo4j/
│   └── schema.md
├── archived/
│   └── BACKEND-DEDUPLICATION-FIXES.md
└── development-prototypes/
```

---

## Documentation Standards

### Adding new feature docs
1. Choose `features/linguistics/` or `features/workspace/` based on which branch the feature belongs to
2. Follow naming: `FEATURE-NAME-DOCUMENTATION.md` (uppercase with hyphens)
3. Update this index with the new entry
4. Update CLAUDE.md if it's a production feature

### Required sections for feature docs
1. Overview — purpose and scope
2. Architecture / Implementation details — file paths and line numbers
3. API Endpoints — with request/response examples
4. Current State — done vs. pending
5. Known Limitations — document gaps proactively

### Moving docs between branches
If a feature grows from linguistic into workspace territory (or vice versa), move it with `git mv` and update both this index and CLAUDE.md.
