# Project Overview and Status

## Table of Contents
+ [Overview](#overview)
+ [General Graph Screen Functionality](#general-graph-screen-functionality)
+ [GraphDB Expansion](#graphdb-expansion)
+ [Embedded Graph Screens](#embedded-graph-screens)
+ [Library Expansion](#library-expansion)
+ [Games Development](#games-development)
+ [Interface Enhancements](#interface-enhancements)
+ [Monitoring & Analytics](#monitoring--analytics)
+ [Bugs and Issues](#bugs-and-issues)
+ [Graph Visualization Improvements](#graph-visualization-improvements)
+ [Contributions](#contributions)

---

## Overview
This document outlines the current status of the Mindroots project, highlighting ongoing tasks, backlog items, and known issues. Contributions are welcome, with areas of expertise required highlighted in the Contributions section.

---

### **General Graph Screen Functionality**
Core functionalities related to the graph screen experience.
+ Clear screen: Not yet implemented.
+ Isolate node/clear all but: Not yet implemented.
+ Scroll results when over limit: Not yet implemented.
+ Node limit control: Not yet implemented.
+ Deleting Nodes: Not yet implemented.
+ Secondary action for nodes: Completed for word nodes to display InfoBubble with Lane entry; word and form nodes, not started.
+ Subcontext menu: Secondary actions need consolidation into a menu with options (Lane, Hand-Wehr, synonyms, corpus locations, collocations, and statistics).
+ Node shades: Add color shades to indicate weight/productivity/incidence/type (verbs darker, nouns lighter; greater incidence darker, less incidence lighter).
+ User-submitted usage examples: Not yet implemented.

### **GraphDB Expansion**
Tasks related to data processing and language integration.
+ Import corpus.quran data using Java API
+ Upload from transliterations Lane database: Pending evaluation; schema is strange.
+ Implement a programmatic transliteration scheme: Pending (Python).
+ Target languages: English and Urdu.
+ Form analysis: Completed for 19 demo words from the 99 names corpus; needs to be automated for entire lexicon.
+ Create a data pipeline for handling 50,000 words with LLM: In progress; OpenAI API costs need estimates.

### **Embedded Graph Screens**
Static page-related features and improvements.
+ Rendering markdown and graphs on static pages: Needs redesign. (About and Getting Started pages)

### **Library Expansion**
Tasks associated with expanding the content library and linking resources.
+ Add Quran and Hadith and link to lexicon: Not started.
+ Graph layers overview articles: Not started.
+ Add graph database statistics articles (e.g., number of words, roots, etc.): Not started.
+ Tweak buttons and placement of the graph screen and buttons: Not started.

### **Games Development**
Interactive features to engage users with the graph content.
+ Guess the Root: Not yet implemented.
+ Guess the Form: Not yet implemented.

### **Interface Enhancements**
+ Main Menu Transformation: Not yet implemented.
+ Add a button to return to the main site and exit the application: Not yet implemented.

### **Monitoring & Analytics**
+ Install Fail2Ban: Security setup needed.
+ Explore tools for first-click analysis: Currently using Prometheus with Grafana; needs setup.

### **Bugs and Issues**
+ Corpus Context Issue: Context is lost or not cached when revisiting the screen; needs to be tied to corpus item selection.
+ Duplicates Issue: Duplicate nodes or data showing up incorrectly.
+ Missing English Labels: English labels missing for most words in the 99 Names corpus (linked to translations task above).

### **Graph Visualization Improvements**
+ Slow node movement.
+ Fix alignment.
+ Stop unnecessary movements.
+ Resize graph screen.

---

## Contributions

We welcome contributions from developers and researchers interested in enhancing the Mindroots project. Below are the areas of expertise required for incomplete tasks:

### **General Graph Screen Functionality**
+ **Expertise Required**: JavaScript, D3.js, UX/UI Design.

### **GraphDB Transliterations and Translations**
+ **Expertise Required**: Python, Natural Language Processing, API Integration.

### **Library Expansion**
+ **Expertise Required**: Neo4j, Content Management, Lexicography.

### **Games Development**
+ **Expertise Required**: Game Design, JavaScript, Educational Tools.

### **Monitoring & Analytics**
+ **Expertise Required**: DevOps, Security, Monitoring Tools (Prometheus, Grafana).

### **General UI/UX Improvements**
+ **Expertise Required**: UI/UX Design, Frontend Development, User Testing.

---

## Additional Considerations

While this README is somewhat unconventional, it provides a structured view of the project's tasks and invites collaboration in a focused manner.