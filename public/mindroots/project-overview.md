# 🌿 Mindroots Project Roadmap

*Last Updated: August 19, 2025*

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

### **Recently Completed** ✅
- **Link-Returning Endpoints** *(2025-08-19)* - Complete backend overhaul to return both link data and node data instead of just node data
- **API Authentication System** *(2025-08-12)* - Bearer token protection for all endpoints
- **Node Inspector Feature** *(2025-08-12)* - Comprehensive node inspection with properties, relationships, and connections
- **Semitic Language Filter Integration** *(2025-08-18)* - Complete L1/L2 language context system with semantic property support

### **GraphRAG Route**
- ✅ Basic implementation complete
- 🔄 Harden with query validation & permissions *(In Progress)*
- ⏳ Add logging/sandboxing if needed

### **Context Menu Endpoints**
- ✅ `/inspect/:nodeType/:nodeId` - Node inspection
- ⏳ `/report_issue` *(Planned)*
- ✅ `/expand/:sourceType/:sourceId/:targetType` - Node expansion
- ⏳ `/get_more_info` (may call GPT) *(Planned)*
- ⏳ Node-type-based routing for summary logic

### **Data Architecture**
- ✅ **Enhanced API Responses** - Link and node data integration
- 🔄 **RadicalPosition Layer** - Flexible radical indexing system *(Ongoing improvements)*

---

## 🎨 Frontend & UI/UX

### **Recently Completed** ✅
- **Static Page Typography Overhaul** *(2025-08-19)* - Professional typography system with proper spacing, readable fonts, and mobile responsiveness
- **Acknowledgements Page** *(2025-08-19)* - Complete attribution page with collapsible license notices
- **Semantic Language Integration** *(2025-08-18)* - Full L1/L2 language context with `sem` property support across all views
- **Quran Rendering Optimization** *(2025-08-14)* - Major performance improvements and UI enhancements
- **Node Inspector UI** *(2025-08-12)* - Full-screen modal with comprehensive node data display

### **Active Development** 🔄
- **InfoBubble Responsive Design** - Desktop functional, mobile layout needs fixes
- **Context Menu UI Enhancement** - Connect to backend endpoints
- **Etymon Highlighting** - Now unblocked with link data availability

### **Planned Features** ⏳
- **Enhanced Mobile Experience** - Continued responsive improvements

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

### **Recently Completed** ✅
- **Semantic Language Property Integration** *(2025-08-18)* - Added `sem` property support across corpus objects and corpus items
- **Language Context System** *(2025-08-18)* - Full L1/L2 switching with semantic display modes

### **Abstracting Node Properties → Nodes**
#### **Radical Nodes** ⏳
- Create 28 radical consonant nodes
- Link to roots by consonant structure (r1, r2, r3)
- Add metadata: articulation, IPA, formant group

#### **Definition Nodes** ⏳
- Break out `definitions` property
- Subdivide into:
  - First/Second/Third meanings
  - Contrary significations
  - References (Qur'an, poetry, proverbs)
  - Abbreviated/partial citations

### **Morphological Forms** 🔄
- Clean and convert noisy text props on Word nodes into proper Form nodes
- Validate forms *(In Progress)*

### **Semantic Family Expansion** 🔄
- ✅ **Semitic Language Groupings** *(2025-08-18)* - 9 language families with 40+ languages
- 🔄 Integrate Semitic root data from Glenn Stevens *(In Progress)*
- ⏳ Map Arabic roots to Hebrew, Syriac, Aramaic equivalents

### **Etymology Imports** ⏳
- Arabic: Lisān al-ʿArab, Hans Wehr
- Cross-lingual: Wiktionary, Indo-European databases

### **Root Architecture**
- 🔄 Support alternate roots (e.g., "or/on") *(In Progress)*
- ✅ **RadicalPosition Layer** - Flexible radical indexing system *(Completed)*

### **Data Import Status**
#### **Completed** ✅
- ✅ **Shanfara poem import** *(2024-11-17)*
- ✅ **Quran corpus import & render** *(2024-10-23)*
- ✅ **Lane's Lexicon entries imported** *(2024-08-31)*
- ✅ **Database redesign for multiple corpora** *(2024-07-28)*
- ✅ **Root search & multi-script support** *(2024-07-23)*

#### **Planned** ⏳
- Create separate Neo4j instances for QRoots and Mindroots
- Classify roots: geminate, triliteral, extended
- Handle >3-letter root search properly
- Import Shakespeare's sonnets

---

## 🧬 Content & Documentation

### **Recently Completed** ✅
- **Acknowledgements Page** *(2025-08-19)* - Complete attribution with legal notices
- **Typography & Readability Overhaul** *(2025-08-19)* - Professional styling for all static pages

### **Active Projects** 🔄
- Finish article on universality of the infective
- Translate and import Al-Shanfara's poem
- Improve guides and articles
- Create user stories/videos for YouTube/TikTok

### **Content Milestones** *(Completed)*
- ✅ **First blog post published** *(2024-09-28)*
- ✅ **Blog functionality update** *(2024-09-26)*
- ✅ **Markdown rendering adjustment** *(2024-09-23)*
- ✅ **Project overview documentation** *(2024-09-21)*

---

## 🧠 Infrastructure & Architecture

### **Agentic System**
- ✅ **Current GPT Workflow**: Input → Arabic → Root → Cypher → Summary *(working well)*

### **Planned Agent Roles** ⏳
- **Hub Agent** – dispatch
- **Explainer Agent** – system Q&A
- **Validator Agent** – QA forms, grammar, translation
- **Quiz Agent** – gamified learning
- **Onboarding Agent** – user tracking, session memory

### **Infrastructure Planning** 🔄
- Split Mindroots Instances *(In Progress)*
- Enhanced security and monitoring

### **Security & Operations**

#### **Recently Completed** ✅
- **Fail2Ban Installation** *(2025-08-19)* - Server intrusion prevention system deployed
- **API Authentication System** *(2025-08-12)* - Bearer token protection for all endpoints
- **CORS and basename configuration** *(2024-08-08)*

#### **Active Security Measures** 🔄
- Cypher query route hardening (roles or whitelisted query types) *(In Progress)*

#### **Planned Security Enhancements** ⏳
- Adjust Nginx and React URLs for distinct routes (`option.life/qroots` vs `mindroots/mindroots`)
- Enhanced monitoring and logging systems
- Query validation and sandboxing

---

## 📊 Recent Development Velocity

### **August 2025 Sprint** *(Highly Productive)*
- 🚀 **12 major commits** in 5 days
- ✅ **Link data integration** - Backend overhaul for enhanced API responses
- ✅ **Semantic language system** - Complete L1/L2 integration
- ✅ **Typography overhaul** - Professional static page styling
- ✅ **Acknowledgements page** - Legal attribution and licensing
- ✅ **Table view improvements** - Enhanced node display
- ✅ **Quran rendering optimization** - Performance improvements

### **Key Technical Achievements**
1. **Enhanced backend architecture** - Link and node data integration
2. **Full semantic language support** across all components
3. **Professional typography system** without external framework
4. **Comprehensive node inspection** with relationship mapping
5. **API security implementation** with Bearer token authentication
6. **Server security hardening** with Fail2Ban deployment

---

## 🎯 Next Quarter Priorities

### **Q4 2025 Focus Areas**
1. **GraphRAG System Completion**
   - Query validation and security
   - Agent role implementation
   - Enhanced GPT integration

2. **User Experience Polish**
   - Mobile responsiveness completion
   - Etymon highlighting implementation (now unblocked)
   - Context menu functionality

3. **Content Expansion**
   - Semantic family data integration
   - Additional corpus imports
   - Educational content creation

4. **Infrastructure Maturity**
   - Split instance deployment
   - Monitoring and analytics
   - Performance optimization

---

*This roadmap reflects the current state and strategic direction of the Mindroots project. Items are marked with status indicators: ✅ Completed, 🔄 In Progress, ⏳ Planned, 🎯 Priority Focus.*