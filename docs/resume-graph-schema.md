# Graph Resume Schema

> Data source for building an interactive graph visualization of Omar's resume.
> Follows the MindRoots metaphor: **Roles** (terms) → **Roots** (highlighted achievements) → **Forms** (technical skills).

---

## Graph Schema

```
(:Role {company, title, dates})-[:HAS_ROOT]->(:Root {tag, bullet})
(:Root)-[:HAS_FORM]->(:Skill {name, class: "general"|"specific"})
```

Cross-role roots (same `tag` appearing under multiple roles) naturally create a connected graph showing career threads.

---

## Roles & Roots

### Role: MindRoots
- **Company**: MindRoots
- **Title**: Founder & Solution Architect
- **Dates**: June 2024 – Present

| # | Root Tag | Bullet | Alternatives |
|---|----------|--------|-------------|
| 1 | Knowledge Graph Platform | Designed and built a full-stack knowledge graph platform (React, Express.js, Neo4j, D3.js) for exploring multi-source domain data, enabling intuitive relationship discovery across thousands of interconnected entities without query language knowledge. | Full-Stack Platform, Interactive Graph Explorer |
| 2 | Graph RAG Pipeline | Architected a Graph RAG pipeline and LLM agent interface providing structured, secure access to graph data through schema-aware decision endpoints — reducing prompt complexity and improving agent reliability. | AI-Enriched Search, LLM Agent Interface |
| 3 | Hybrid Search Architecture | Engineered a hybrid search architecture combining graph traversal with full-text semantic search (Neo4j Lucene), enabling unified discovery across structure and meaning without external search infrastructure. | Graph + Semantic Search, Unified Discovery |
| 4 | Multi-Tenant LLM Orchestration | Built a multi-tenant LLM orchestration system with isolated workspaces, token-based authentication, and versioned artifact pipelines for autonomous content generation and rendering via APIs. | AI Agent Orchestration, Workspace Isolation |
| 5 | Data Validation Framework | Developed a crowd-sourced data validation framework with auditability, rate limiting, and approval workflows to maintain data quality at scale. | Crowd-Sourced QA, Audit Trail System |
| 6 | Technical Documentation | Produced comprehensive system documentation, API specifications, and technical communications to support reproducibility, cross-team development, and client-facing clarity. | Technical Writing, System Runbooks |

---

### Role: MC+A
- **Company**: MC+A
- **Title**: Technical Consultant
- **Dates**: August 2023 – April 2024

| # | Root Tag | Bullet | Alternatives |
|---|----------|--------|-------------|
| 1 | Cross-Functional Delivery | Facilitated cross-functional collaboration to implement advanced search and knowledge management solutions for clients, as well as develop internal best practices, tooling, and documentation, significantly reducing deployment time and improving operational efficiency. | Internal Tooling, Best Practices |
| 2 | Legacy System Migration | Led the modernization and migration of legacy systems for a major city's police department, transitioning from outdated SQL-based systems to Elasticsearch and Logstash pipelines. Defined technical requirements, managed stakeholder alignment, and ensured smooth migration with zero downtime. | Search Modernization, Zero-Downtime Migration |
| 3 | Hybrid Search Prototyping | Developed advanced hybrid search prototypes for B2B clients utilizing retrieval-augmented generation (RAG) and combined sparse and dense vector embeddings. Optimized solutions to align closely with client business objectives, enhancing search accuracy and user experience. | RAG Prototyping, Vector Search |
| 4 | Search Optimization | Directed performance improvements of Elasticsearch clusters by refining index structures and query strategies, utilizing analytics-driven optimizations to enhance search relevance and responsiveness. | Cluster Tuning, Index Optimization |

---

### Role: MindBreeze
- **Company**: MindBreeze LLC
- **Title**: Senior Technical Consultant
- **Dates**: March 2022 – May 2023

| # | Root Tag | Bullet | Alternatives |
|---|----------|--------|-------------|
| 1 | Enterprise ETL Pipeline | Managed the integration and ingestion pipeline for a highly customized advanced search and retrieval solution for a major government transportation client, requiring complex ETL for large data volumes from multiple complex SQL databases and file shares. Oversaw indexing across 15+ Lucene-based indexes, ensuring scalable ingestion into a distributed producer-consumer architecture to support future high-availability production environments. | Large-Scale Ingestion, Distributed Indexing |
| 2 | Custom Search Applications | Designed and delivered customized web-based search applications closely aligned with client-specific use cases, enhancing overall search efficiency and user experience. | Client Search UX, Bespoke Search UI |
| 3 | Agile Discovery | Led Agile discovery and strategic planning sessions, effectively gathering business requirements and aligning stakeholders around clear, actionable implementation strategies. | Requirements Gathering, Strategic Planning |
| 4 | Cross-Functional Delivery | Coordinated cross-functional teams, including pre-sales, product management, and development, to streamline release cycles and remove interdepartmental barriers, improving resolution times and operational efficiency. | Release Coordination, Team Alignment |
| 5 | Client Enablement | Conducted comprehensive client training and provided post-sales technical support, fostering high feature adoption rates and improved customer retention. | Training & Adoption, Post-Sales Support |

---

### Role: CS Energy
- **Company**: CS Energy LLC
- **Title**: Systems Administrator / Consultant
- **Dates**: July 2018 – March 2022

| # | Root Tag | Bullet | Alternatives |
|---|----------|--------|-------------|
| 1 | IT Operations Scaling | Managed IT operations through periods of rapid organizational growth, streamlining onboarding and offboarding processes, reducing licensing costs, and enhancing cross-departmental coordination, particularly between IT and HR. | Growth Management, Process Streamlining |
| 2 | Executive Dashboards | Developed and maintained internal dashboards to enable real-time tracking of IT assets, facilitating informed executive oversight of budgeting, resource allocation, and service management. | Asset Tracking, Data Visibility |
| 3 | Enterprise Migration | Led comprehensive migrations of enterprise-grade project management solutions, coordinating closely with vendors for configuration, deployment, and seamless integration with internal workflows. | Vendor Coordination, Platform Migration |
| 4 | Stakeholder Engagement | Directed technical discussions and engagements with key stakeholders across multiple departments, ensuring alignment of technical strategies with overall business objectives and security compliance. | Strategic Alignment, Security Compliance |

---

### Role: Foresters / Rutgers
- **Company**: Foresters Financial & Rutgers University
- **Title**: User Support Analyst & Senior IT Analyst
- **Dates**: 2014 – 2018

| # | Root Tag | Bullet | Alternatives |
|---|----------|--------|-------------|
| 1 | Technical Support | Delivered comprehensive on-site and remote technical support for national internal sales and management teams, significantly improving response times and reducing escalations. | Escalation Reduction, National Support |
| 2 | Issue Coordination | Managed effective issue routing and coordination, enhancing first-call resolution rates and ensuring adherence to response SLAs. | SLA Management, Ticket Routing |
| 3 | Client Enablement | Provided targeted technical support and training to faculty, staff, and students, effectively decreasing help-desk ticket volumes and supporting improved retention of student employees. | Training & Adoption, Help Desk Optimization |
| 4 | Self-Service Tooling | Created and implemented practical training materials for hardware and software, increasing self-service adoption and substantially reducing repetitive support requests. | Knowledge Base, Documentation |

---

## Cross-Role Root Threads

These roots appear under multiple roles, forming the career threads that connect the graph:

| Root Tag | Roles |
|----------|-------|
| **Cross-Functional Delivery** | MC+A, MindBreeze |
| **Stakeholder Engagement** | CS Energy *(also implicit in MindRoots "technical communications" and MC+A "stakeholder alignment")* |
| **Client Enablement** | MindBreeze, Foresters/Rutgers |
| **Technical Documentation** | MindRoots *(also implicit in MC+A "best practices" and Foresters "training materials")* |
| **Legacy System Migration** / **Enterprise Migration** | MC+A, CS Energy |
| **Hybrid Search** | MindRoots (Hybrid Search Architecture), MC+A (Hybrid Search Prototyping) |

---

## Skill Nodes

### General (Core Competencies)

| Skill | Connected Roots |
|-------|----------------|
| Agile methodologies | Agile Discovery, Cross-Functional Delivery |
| AI/LLM orchestration | Graph RAG Pipeline, Multi-Tenant LLM Orchestration, Hybrid Search Prototyping |
| Cloud computing | Enterprise ETL Pipeline, IT Operations Scaling |
| Custom GPT integration | Multi-Tenant LLM Orchestration |
| Data modeling & pipeline design | Knowledge Graph Platform, Graph RAG Pipeline, Enterprise ETL Pipeline, Data Validation Framework |
| DevOps | IT Operations Scaling, Enterprise Migration |
| ETL processes | Enterprise ETL Pipeline, Legacy System Migration |
| Graph databases & Graph RAG | Knowledge Graph Platform, Graph RAG Pipeline, Hybrid Search Architecture |
| Hybrid search solutions | Hybrid Search Architecture, Hybrid Search Prototyping, Search Optimization, Custom Search Applications |
| Information retrieval | Hybrid Search Architecture, Custom Search Applications, Hybrid Search Prototyping |
| Knowledge graph architecture | Knowledge Graph Platform, Graph RAG Pipeline |
| Multi-tenant systems | Multi-Tenant LLM Orchestration |
| Natural Language Processing (NLP) | Graph RAG Pipeline, Hybrid Search Prototyping |
| Ontology design | Knowledge Graph Platform, Hybrid Search Architecture |
| Product management | Agile Discovery, Cross-Functional Delivery |
| Query optimization | Hybrid Search Architecture, Search Optimization |
| Retrieval-Augmented Generation (RAG) | Graph RAG Pipeline, Hybrid Search Prototyping |
| Semantic search | Graph RAG Pipeline, Hybrid Search Architecture, Hybrid Search Prototyping |
| Solutions architecture | Knowledge Graph Platform, Enterprise ETL Pipeline, Multi-Tenant LLM Orchestration |
| Technical writing | Technical Documentation, Self-Service Tooling, Client Enablement |
| UI/UX design | Knowledge Graph Platform, Custom Search Applications, Executive Dashboards |
| Workflow automation | Data Validation Framework, IT Operations Scaling, Multi-Tenant LLM Orchestration |

### Specific (Software / Frameworks / Languages)

| Skill | Connected Roots |
|-------|----------------|
| AWS | Enterprise ETL Pipeline, Multi-Tenant LLM Orchestration |
| Azure | IT Operations Scaling |
| Cypher | Knowledge Graph Platform, Hybrid Search Architecture, Graph RAG Pipeline |
| D3.js | Knowledge Graph Platform |
| Docker | Enterprise ETL Pipeline, Multi-Tenant LLM Orchestration |
| Elasticsearch | Legacy System Migration, Search Optimization, Custom Search Applications |
| Express.js | Knowledge Graph Platform, Multi-Tenant LLM Orchestration |
| Git | Technical Documentation *(all roles)* |
| Linux/Unix | Enterprise ETL Pipeline, IT Operations Scaling |
| Neo4j | Knowledge Graph Platform, Graph RAG Pipeline, Hybrid Search Architecture |
| NLTK | Graph RAG Pipeline |
| Node.js | Knowledge Graph Platform, Multi-Tenant LLM Orchestration |
| OpenAI API | Graph RAG Pipeline, Multi-Tenant LLM Orchestration, Hybrid Search Prototyping |
| PM2 | Multi-Tenant LLM Orchestration |
| Power Automate | IT Operations Scaling |
| Power BI | Executive Dashboards |
| PowerShell | IT Operations Scaling |
| Puppeteer | Multi-Tenant LLM Orchestration |
| Python | Hybrid Search Prototyping, Graph RAG Pipeline |
| React.js | Knowledge Graph Platform |
| REST APIs | Graph RAG Pipeline, Multi-Tenant LLM Orchestration, Custom Search Applications |
| SharePoint | IT Operations Scaling, Self-Service Tooling |
| SQL | Legacy System Migration, Enterprise ETL Pipeline |
| Talend | Enterprise ETL Pipeline |
| Microsoft 365 | IT Operations Scaling, Client Enablement |

---

## Education

- **Rutgers, The State University of New Jersey, New Brunswick** — 2017
- BA: Linguistics & Cognitive Science
