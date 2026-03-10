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
| 1 | Knowledge Graph Platform | Designed and built a full-stack knowledge management platform (React, Express.js, Neo4j, D3.js) that transforms complex, multi-source domain data into an interactive graph — enabling users to search, explore, and discover relationships across thousands of interconnected entities without writing queries. | Full-Stack Platform, Interactive Graph Explorer |
| 2 | Graph RAG Pipeline | Architected a Graph RAG pipeline integrating LLM-generated analysis with a Neo4j knowledge graph, synthesizing five independent data sources into a unified, versioned semantic layer that enriches search results with AI-driven contextual insights. | AI-Enriched Search, Semantic Data Layer |
| 3 | Multi-Tenant GPT System | Built a multi-tenant Custom GPT orchestration system with isolated workspaces, token-based authentication, and a versioned content pipeline — enabling multiple AI agents to autonomously generate, iterate, and render production-ready assets through API-driven workflows. | AI Agent Orchestration, Workspace Isolation |
| 4 | API Security Design | Implemented tiered API security with role-based access control and query sanitization, enabling safe LLM access to the graph database while protecting data integrity — a pattern applicable to any organization exposing structured data to AI agents. | LLM Access Control, Query Sanitization |
| 5 | Graph-Native Search | Designed a graph-native search engine with flexible schema and multi-mode query support (exact match, wildcard, permutation), replacing rigid legacy queries with a scalable approach that adapts as the underlying data model evolves. | Flexible Query Engine, Schema-Adaptive Search |
| 6 | Data Validation Pipeline | Built a community-driven data validation pipeline with rate limiting, approval tracking, and immutable audit trails — enabling crowd-sourced quality improvement with full traceability across the dataset. | Crowd-Sourced QA, Audit Trail System |
| 7 | Technical Documentation | Authored and maintained comprehensive technical documentation covering system architecture, API specifications (OpenAPI), deployment procedures, and operational runbooks — ensuring the platform is reproducible and transferable. | Technical Writing, System Runbooks |
| 8 | Stakeholder Engagement | Conducted technical demonstrations, user interviews, and co-hosted a podcast series to communicate platform capabilities and gather real-world feedback from domain experts. | User Research, Technical Demos |

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
| **Stakeholder Engagement** | MindRoots, CS Energy |
| **Client Enablement** | MindBreeze, Foresters/Rutgers |
| **Technical Documentation** | MindRoots *(also implicit in MC+A "best practices" and Foresters "training materials")* |
| **Legacy System Migration** / **Enterprise Migration** | MC+A, CS Energy |

---

## Skill Nodes

### General (Core Competencies)

| Skill | Connected Roots |
|-------|----------------|
| Agile methodologies | Agile Discovery, Cross-Functional Delivery |
| AI/LLM orchestration | Graph RAG Pipeline, Multi-Tenant GPT System, Hybrid Search Prototyping |
| API security design | API Security Design |
| Cloud computing | Enterprise ETL Pipeline, IT Operations Scaling |
| Custom GPT integration | Multi-Tenant GPT System |
| Data modeling & pipeline design | Knowledge Graph Platform, Graph RAG Pipeline, Enterprise ETL Pipeline, Data Validation Pipeline |
| DevOps | IT Operations Scaling, Enterprise Migration |
| ETL processes | Enterprise ETL Pipeline, Legacy System Migration |
| Graph databases & Graph RAG | Knowledge Graph Platform, Graph RAG Pipeline, Graph-Native Search |
| Hybrid search solutions | Hybrid Search Prototyping, Search Optimization, Custom Search Applications |
| Information retrieval | Graph-Native Search, Custom Search Applications, Hybrid Search Prototyping |
| Knowledge graph architecture | Knowledge Graph Platform, Graph RAG Pipeline |
| Multi-tenant systems | Multi-Tenant GPT System |
| Natural Language Processing (NLP) | Graph RAG Pipeline, Hybrid Search Prototyping |
| Ontology design | Knowledge Graph Platform, Graph-Native Search |
| Product management | Agile Discovery, Cross-Functional Delivery, Stakeholder Engagement |
| Query optimization | Graph-Native Search, Search Optimization |
| Retrieval-Augmented Generation (RAG) | Graph RAG Pipeline, Hybrid Search Prototyping |
| Semantic search | Graph RAG Pipeline, Hybrid Search Prototyping, Graph-Native Search |
| Solutions architecture | Knowledge Graph Platform, Enterprise ETL Pipeline, Multi-Tenant GPT System |
| Technical writing | Technical Documentation, Self-Service Tooling, Client Enablement |
| UI/UX design | Knowledge Graph Platform, Custom Search Applications, Executive Dashboards |
| Workflow automation | Data Validation Pipeline, IT Operations Scaling, Multi-Tenant GPT System |

### Specific (Software / Frameworks / Languages)

| Skill | Connected Roots |
|-------|----------------|
| AWS | Enterprise ETL Pipeline, Multi-Tenant GPT System |
| Azure | Cloud computing *(general)*, IT Operations Scaling |
| Cypher | Knowledge Graph Platform, Graph-Native Search, API Security Design |
| D3.js | Knowledge Graph Platform |
| Docker | Enterprise ETL Pipeline, Multi-Tenant GPT System |
| Elasticsearch | Legacy System Migration, Search Optimization, Custom Search Applications |
| Express.js | Knowledge Graph Platform, Multi-Tenant GPT System, API Security Design |
| Git | Technical Documentation *(all roles)* |
| Linux/Unix | Enterprise ETL Pipeline, IT Operations Scaling |
| Neo4j | Knowledge Graph Platform, Graph RAG Pipeline, Graph-Native Search, API Security Design |
| NLTK | Graph RAG Pipeline |
| Node.js | Knowledge Graph Platform, Multi-Tenant GPT System |
| OpenAI API | Graph RAG Pipeline, Multi-Tenant GPT System, Hybrid Search Prototyping |
| PM2 | Multi-Tenant GPT System |
| Power Automate | IT Operations Scaling, Workflow automation |
| Power BI | Executive Dashboards |
| PowerShell | IT Operations Scaling |
| Puppeteer | Multi-Tenant GPT System |
| Python | Hybrid Search Prototyping, Graph RAG Pipeline |
| React.js | Knowledge Graph Platform |
| REST APIs | API Security Design, Multi-Tenant GPT System, Custom Search Applications |
| SharePoint | IT Operations Scaling, Self-Service Tooling |
| SQL | Legacy System Migration, Enterprise ETL Pipeline |
| Talend | Enterprise ETL Pipeline |
| Microsoft 365 | IT Operations Scaling, Client Enablement |

---

## Education

- **Rutgers, The State University of New Jersey, New Brunswick** — 2017
- BA: Linguistics & Cognitive Science
