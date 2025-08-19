# 🌿 Mindroots Project Roadmap

---

## 🧠 Top-Level Priority Summary

**Primary Goal**
- Finish and secure GraphRAG system (GPT + Neo4j interface)

**Security & Operations**
- Cypher query route must be locked down (roles or whitelisted query types)
- Install Fail2Ban or similar tools *(old item)*
- Adjust Nginx and React URLs for distinct routes (`option.life/qroots` vs `mindroots/mindroots`) *(old item)*

**Strategic Direction**
- Embrace “invisible interface” philosophy: GPT as main entrypoint
- Begin light public testing *(already started)*
- Plan split instances
  - Quranroots – free Qur’an, Names of God, open to all
  - Mindroots: Modular/Research – extended linguistic corpora
- Long-term: unify Lisān Lab insights, podcast content, GPT-generated reports

---

## 🔧 Backend Engineering

**GraphRAG Route**
- Harden with query validation & permissions
- Add logging/sandboxing if needed

**Context Menu Endpoints**
- `/report_issue`
- `/expand_node`
- `/get_more_info` (may call GPT)
- Node-type-based routing for summary logic

**Link-Returning Endpoints**
- Still partial – needed for frontend etymon highlighting

---

## 🧬 Context Engineering

**Abstracting Node Properties → Nodes**
- Radical Nodes
  - Create 28 radical consonant nodes
  - Link to roots by consonant structure (r1, r2, r3)
  - Add metadata: articulation, IPA, formant group
- Definition Nodes
  - Break out `definitions` property
  - Subdivide into:
    - First/Second/Third meanings
    - Contrary significations
    - References (Qur’an, poetry, proverbs)
    - Abbreviated/partial citations

**Morphological Forms**
- Clean and convert noisy text props on Word nodes into proper Form nodes
- Validate forms

**Semantic Family Expansion**
- Integrate Semitic root data from Glenn Stevens
- Map Arabic roots to Hebrew, Syriac, Aramaic equivalents

**Etymology Imports (Planned)**
- Arabic: Lisān al-ʿArab, Hans Wehr
- Cross-lingual: Wiktionary, Indo-European databases

**Split Root Architecture**
- Support alternate roots (e.g., “or/on”)

**Legacy / Pending Data Work**
- Create separate Neo4j instances for QRoots and Mindroots *(In Progress)*
- Classify roots: geminate, triliteral, extended *(Not Started)*
- Handle >3-letter root search properly *(Not Started)*
- Import Shakespeare’s sonnets *(Not Started)*
- 2024-11-17: Shanfara poem import *(Completed?)*
- 2024-10-23: Quran corpus import & render *(Completed)*
- 2024-08-31: Lane’s Lexicon entries imported *(Completed)*
- 2024-07-28: Database redesign for multiple corpora *(Completed)*
- 2024-07-23: Root search & multi-script support *(Completed)*

---

## 🖥️ Frontend & UI/UX

**InfoBubble**
- Desktop functional
- Mobile layout needs responsive fixes

**Context Menu UI**
- Summarize / More Info (GPT)
- Expand/Collapse Node
- Report Issue
- Connect to backend endpoints

**Etymon Highlighting**
- Blocked until link data is returned

**UX Philosophy**
- Minimal manual interaction (“Invisible Interface”)
- Future: Surface Lisān Lab podcast + auto-generated reports

**Legacy / Completed UI Enhancements**
- Free-form corpus item highlighting (2024-12-02)
- Ontological node shading (2024-11-29)
- Text layout options (2024-10-28)
- Dynamic node sizes (2024-10-08)
- Node limit slider (2024-09-29)
- Word node shading for nouns/verbs/phrases (2024-09-22)
- Infobubble display for word entries (2024-09-02)
- Graph screen adjustments (2024-09-07)
- React Context API adoption (2024-08-19)

---

## 🧬 Content & Documentation

**Active**
- Finish article on universality of the infective
- Translate and import Al-Shanfara’s poem
- Improve guides and articles
- Create user stories/videos for YouTube/TikTok

**Legacy**
- 2024-09-28: First blog post published
- 2024-09-26: Blog functionality update
- 2024-09-23: Markdown rendering adjustment
- 2024-09-21: Project overview documentation
- Blog layout adjustment *(Not Started)*

---

## 🧠 Infrastructure & Architecture

**Agentic System**
- Current GPT Workflow: Input → Arabic → Root → Cypher → Summary *(working well)*
- Planned Agent Roles
  - Hub Agent – dispatch
  - Explainer Agent – system Q&A
  - Validator Agent – QA forms, grammar, translation
  - Quiz Agent – gamified learning
  - Onboarding Agent – user tracking, session memory

**Infrastructure Planning**
- Split Mindroots Instances

**Legacy Ops & Security**
- CORS and basename configuration *(2024-08-08)*


---