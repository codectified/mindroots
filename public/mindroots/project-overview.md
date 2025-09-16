# 🌿 Mindroots Project Roadmap

*Last Updated: September 16, 2025*

## 📋 Table of Contents

1. [🧠 Top-Level Priority Summary](#-top-level-priority-summary)
2. [🔧 Backend Engineering](#-backend-engineering)
3. [🎨 Frontend & UI/UX](#-frontend--uiux)
4. [🧬 Context Engineering](#-context-engineering)
5. [🧬 Content & Documentation](#-content--documentation)
6. [🧠 Infrastructure & Architecture](#-infrastructure--architecture)
7. [📊 Recent Development Velocity](#-recent-development-velocity)
8. [🎯 Next Quarter Priorities](#-next-quarter-priorities)

---

## 🧠 Top-Level Priority Summary

### **Primary Goal**
- ✅ **Finish and secure GraphRAG system** (GPT + Neo4j interface)

### **Strategic Direction**
- 🎯 Embrace "invisible interface" philosophy: GPT as main entrypoint
- ✅ Begin light public testing *(Active)*
- 🔄 Plan split instances *(In Progress)*
  - **Quranroots** – free Qur'an, Names of God, open to all
  - **Mindroots: Modular/Research** – extended linguistic corpora
- 🔄 Long-term: unify Lisān Lab insights, podcast content, GPT-generated reports

---

## 🔧 Backend Engineering

### **Pending Development** ⏳
- **Context Menu Endpoints**
  - `/report_issue` *(Planned)*
  - `/get_more_info` (may call GPT) *(Planned)*
  - Node-type-based routing for summary logic
- **GraphRAG Route Hardening**
  - Add logging/sandboxing if needed
  - Enhanced query validation & permissions

### **Active Development** 🔄
- **Data Architecture Improvements**
  - **RadicalPosition Layer** - Ongoing improvements to flexible radical indexing system

### **Recently Completed** ✅
- **Analysis Nodes System** *(2025-09-16)* - LLM-generated linguistic analysis with versioned storage and GPT integration
- **News Section Backend** *(2025-09-16)* - Latest analysis endpoint with proper timestamp ordering
- **Validation System Enhancement** *(2025-09-12)* - Nested-only API format for better GPT compatibility
- **Dual API Key Security** *(2025-09-12)* - Public/Admin key system for GPT orchestration
- **Link-Returning Endpoints** *(2025-08-19)* - Complete backend overhaul to return both link data and node data
- **API Authentication System** *(2025-08-12)* - Bearer token protection for all endpoints
- **Node Inspector Feature** *(2025-08-12)* - Comprehensive node inspection with properties, relationships, and connections
- **Semitic Language Filter Integration** *(2025-08-18)* - Complete L1/L2 language context system

### **GraphRAG System** ✅
- Basic implementation complete
- Query validation & permissions implemented
- Dual API key system for secure GPT access

### **Context Menu Endpoints** (Implemented)
- ✅ `/inspect/:nodeType/:nodeId` - Node inspection
- ✅ `/expand/:sourceType/:sourceId/:targetType` - Node expansion
- ✅ `/latest-analysis` - News section integration
- ✅ `/write-root-analysis` - Analysis node creation
- ✅ `/analysis/:nodeType/:nodeId` - Analysis data retrieval

---

## 🎨 Frontend & UI/UX

### **Pending Development** ⏳
- **Enhanced Mobile Experience** - Continued responsive improvements
- **Etymon Highlighting** - Now unblocked with link data availability

### **Active Development** 🔄
- **Context Menu UI Enhancement** - Connect remaining backend endpoints

### **Recently Completed** ✅
- **News Section Implementation** *(2025-09-16)* - Dynamic latest analysis display with InfoBubble integration
- **InfoBubble Positioning System** *(2025-09-16)* - Smart click-based positioning with comprehensive documentation
- **Validation System UI** *(2025-09-12)* - Inline editing with approval workflow and spam protection
- **Navigation System** *(2025-09-07)* - Complete corpus item navigation with hierarchical ID support
- **UI Overhaul & Context Menu** *(2025-08-30)* - Streamlined interface with integrated validation workflow
- **Static Page Typography Overhaul** *(2025-08-19)* - Professional typography system with proper spacing and mobile responsiveness
- **Acknowledgements Page** *(2025-08-19)* - Complete attribution page with collapsible license notices
- **Semantic Language Integration** *(2025-08-18)* - Full L1/L2 language context with `sem` property support
- **Quran Rendering Optimization** *(2025-08-14)* - Major performance improvements and UI enhancements
- **Node Inspector UI** *(2025-08-12)* - Full-screen modal with comprehensive node data display

### **UX Philosophy**
- 🎯 Minimal manual interaction ("Invisible Interface")
- 🔄 Future: Surface Lisān Lab podcast + auto-generated reports

### **Legacy UI Enhancements** *(Completed)*
- ✅ **Table View Enhancement** *(2025-08-19)* - Improved NodesTable with all node types and semantic display
- ✅ **Free-form corpus item highlighting** *(2024-12-02)*
- ✅ **Ontological node shading** *(2024-11-29)*
- ✅ **Text layout options** *(2024-10-28)*
- ✅ **Dynamic node sizes** *(2024-10-08)*
- ✅ **Node limit slider** *(2024-09-29)*
- ✅ **Word node shading for nouns/verbs/phrases** *(2024-09-22)*
- ✅ **Infobubble display for word entries** *(2024-09-02)*
- ✅ **Graph screen adjustments** *(2024-09-07)*
- ✅ **React Context API adoption** *(2024-08-19)*

---

## 🧬 Context Engineering

### **Pending Development** ⏳

#### **Abstracting Node Properties → Nodes**
- **Radical Nodes** - Create 28 radical consonant nodes
  - Link to roots by consonant structure (r1, r2, r3)
  - Add metadata: articulation, IPA, formant group
- **Definition Nodes** - Break out `definitions` property
  - Subdivide into: First/Second/Third meanings, Contrary significations
  - References (Qur'an, poetry, proverbs), Abbreviated/partial citations

#### **Etymology Imports**
- Arabic: Lisān al-ʿArab, Hans Wehr
- Cross-lingual: Wiktionary, Indo-European databases

#### **Data Import Planning**
- Create separate Neo4j instances for QRoots and Mindroots
- Classify roots: geminate, triliteral, extended
- Handle >3-letter root search properly
- Import Shakespeare's sonnets

### **Active Development** 🔄
- **Morphological Forms** - Clean and convert noisy text props on Word nodes into proper Form nodes
- **Semantic Family Expansion** - Integrate Semitic root data from Glenn Stevens
- **Root Architecture** - Support alternate roots (e.g., "or/on")

### **Recently Completed** ✅
- **Analysis Nodes Integration** *(2025-09-16)* - LLM-generated analysis with dual schema support (v1/v2)
- **Hierarchical ID Compatibility** *(2025-09-07)* - Mixed ID schema supporting both integer and semantic IDs
- **Semantic Language Property Integration** *(2025-08-18)* - Added `sem` property support across corpus objects and corpus items
- **Language Context System** *(2025-08-18)* - Full L1/L2 switching with semantic display modes
- **Semitic Language Groupings** *(2025-08-18)* - 9 language families with 40+ languages
- **RadicalPosition Layer** *(2025-08)* - Flexible radical indexing system

### **Data Import Status - Completed** ✅
- **Shanfara poem import** *(2024-11-17)*
- **Quran corpus import & render** *(2024-10-23)*
- **Lane's Lexicon entries imported** *(2024-08-31)*
- **Database redesign for multiple corpora** *(2024-07-28)*
- **Root search & multi-script support** *(2024-07-23)*

---

## 🧬 Content & Documentation

### **Pending Development** ⏳
- Finish article on universality of the infective
- Translate and import Al-Shanfara's poem
- Improve guides and articles
- Create user stories/videos for YouTube/TikTok

### **Active Projects** 🔄
- **News Section Content** - Regular updates to `/public/mindroots/news.md`

### **Recently Completed** ✅
- **InfoBubble Positioning Documentation** *(2025-09-16)* - Comprehensive guide with four positioning patterns
- **Documentation Index Expansion** *(2025-09-16)* - Updated with latest feature documentation
- **Analysis Nodes Documentation** *(2025-09-12)* - Complete technical documentation with API examples
- **Acknowledgements Page** *(2025-08-19)* - Complete attribution with legal notices
- **Typography & Readability Overhaul** *(2025-08-19)* - Professional styling for all static pages

### **Content Milestones** *(Completed)*
- ✅ **First blog post published** *(2024-09-28)*
- ✅ **Blog functionality update** *(2024-09-26)*
- ✅ **Markdown rendering adjustment** *(2024-09-23)*
- ✅ **Project overview documentation** *(2024-09-21)*

---

## 🧠 Infrastructure & Architecture

### **Pending Development** ⏳

#### **Planned Agent Roles**
- **Hub Agent** – dispatch
- **Explainer Agent** – system Q&A
- **Validator Agent** – QA forms, grammar, translation
- **Quiz Agent** – gamified learning
- **Onboarding Agent** – user tracking, session memory

#### **Security & Operations Planning**
- Adjust Nginx and React URLs for distinct routes (`option.life/qroots` vs `mindroots/mindroots`)
- Enhanced monitoring and logging systems
- Query validation and sandboxing

### **Active Development** 🔄
- **Infrastructure Planning** - Split Mindroots Instances
- **Security Measures** - Cypher query route hardening (roles or whitelisted query types)

### **Recently Completed** ✅

#### **Agentic System**
- **Current GPT Workflow**: Input → Arabic → Root → Cypher → Summary *(working well)*
- **Dual API Key System** *(2025-09-12)* - Public/Admin access control for GPT orchestration
- **Analysis Node Integration** *(2025-09-12)* - GPT-generated linguistic analysis system

#### **Security & Operations**
- **Fail2Ban Installation** *(2025-08-19)* - Server intrusion prevention system deployed
- **API Authentication System** *(2025-08-12)* - Bearer token protection for all endpoints
- **CORS and basename configuration** *(2024-08-08)*

---

## 📊 Recent Development Velocity

### **September 2025 Sprint** *(Highly Productive)*
- 🚀 **News Section Implementation** - Dynamic latest analysis with InfoBubble integration
- 🚀 **InfoBubble Positioning Overhaul** - Smart positioning with comprehensive documentation
- 🚀 **Analysis Nodes System** - Complete LLM-generated linguistic analysis workflow
- 🚀 **Validation System Enhancement** - Improved GPT compatibility with nested-only API format
- 🚀 **Dual API Key Security** - Enhanced security for GPT orchestration

### **August 2025 Sprint** *(Major Milestone)*
- 🚀 **12 major commits** in 5 days
- ✅ **UI Overhaul & Validation System** - Complete interface redesign with inline editing
- ✅ **Navigation System** - Corpus item navigation with mixed ID support
- ✅ **Link data integration** - Backend overhaul for enhanced API responses
- ✅ **Semantic language system** - Complete L1/L2 integration
- ✅ **Typography overhaul** - Professional static page styling
- ✅ **Acknowledgements page** - Legal attribution and licensing

### **Key Technical Achievements**
1. **Analysis Nodes Architecture** - LLM-generated linguistic analysis with versioning
2. **Smart InfoBubble Positioning** - Four documented positioning patterns
3. **Validation System** - Inline editing with approval workflow
4. **Enhanced backend architecture** - Link and node data integration
5. **Dual API key security** - Public/Admin access control
6. **Full semantic language support** across all components
7. **Professional typography system** without external framework
8. **Comprehensive node inspection** with relationship mapping

---

## 🎯 Next Quarter Priorities

### **Q4 2025 Focus Areas**
1. **Content Expansion & Agent Enhancement**
   - Complete agent role implementation
   - Educational content creation
   - Enhanced GPT integration with analysis system

2. **User Experience Polish**
   - Mobile responsiveness completion
   - Etymon highlighting implementation (now unblocked)
   - Context menu functionality completion

3. **Infrastructure Maturity**
   - Split instance deployment (QRoots vs Mindroots)
   - Monitoring and analytics
   - Performance optimization

4. **Semantic Data Integration**
   - Semantic family data integration
   - Additional corpus imports
   - Cross-linguistic root mapping

---

*This roadmap reflects the current state and strategic direction of the Mindroots project. Items are organized with pending tasks first, followed by completed work. Status indicators: ✅ Completed, 🔄 In Progress, ⏳ Planned, 🎯 Priority Focus.*