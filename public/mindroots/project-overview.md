# Project Overview and Status

## Table of Contents
+ [Overview](#overview)
+ [Data Ingestion](#data-ingestion)
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

## Data Ingestion and Querying 
Tasks associated with ingesting data and programmatically linking words to the lexicon in the graph database.


+ <span style=“color:red;”>Node Filtering</span>
+ <span style=“color:red;”>Context shifting</span>
+ <span style=“color:red;”>Root combinating</span>
+ <span style="color:red;">Ingest new corpus data</span>
+ <span style="color:orange;">Automate linking words to lexicon entries</span> 
+ <span style="color:red;">Develop manual data verification process</span> 

### **General Graph Screen Functionality**
Core functionalities related to the graph screen experience.
+ <span style="color:red;">Clear screen</span>
+ <span style="color:red;">Isolate node/clear all but</span>
+ <span style="color:red;">Scroll results when over limit</span>
+ <span style="color:red;">Node limit control</span>
+ <span style="color:red;">Deleting Nodes</span>
+ <span style="color:orange;">Secondary action for nodes; implemented for words</span> 
+ <span style="color:red;">Subcontext menu</span> 
+ <span style="color:green;">Node shades</span>
+ <span style="color:red;">User-submitted usage examples</span>

### **Graph Visualization Improvements**
+ <span style="color:orange;">Slow node movement</span> 
+ <span style="color:orange;">Fix alignment</span> 
+ <span style="color:orange;">Stop unnecessary movements</span> 
+ <span style="color:orange;">Resize graph screen</span> 

### **GraphDB Expansion**
Tasks related to data processing and language integration.

+ <span style=“color:red;”>Import qsynonyms</span>
+ <span style="color:green;">Import corpus.quran data using Java API</span>
+ <span style="color:orange;">Upload from transliterations Lane database</span> (pending evaluation)
+ <span style="color:orange;">Implement a programmatic transliteration scheme</span> 
+ <span style="color:green;">English node labels</span> 
+ <span style="color:orange;">Urdu node labels</span> 
+ <span style="color:orange;">Form analysis</span> 
+ <span style="color:green;">Create a data pipeline for handling 50,000 words with LLM</span> 

### **Embedded Graph Screens**
Static page-related features and improvements.
+ <span style="color:orange;">Rendering markdown and graphs on static pages</span> (needs redesign)

### **Library Expansion**
Tasks associated with expanding the content library and linking resources.
+ <span style="color:red;">Add Quran and Hadith and link to lexicon</span>
+ <span style="color:red;">Graph layers overview articles</span>
+ <span style="color:red;">Add graph database statistics articles</span>
+ <span style="color:red;">Tweak buttons and placement of the graph screen and buttons</span>

### **Games Development**
Interactive features to engage users with the graph content.
+ <span style="color:red;">Guess the Root</span>
+ <span style="color:red;">Guess the Form</span>

### **Interface Enhancements**
+ <span style="color:red;">Main Menu Transformation</span>
+ <span style="color:red;">Add a button to return to the main site and exit the application</span>

### **Monitoring & Analytics**
+ <span style="color:orange;">Install Fail2Ban</span> (security setup needed)
+ <span style="color:orange;">Explore tools for first-click analysis</span> 

### **Bugs and Issues**
+ <span style="color:orange;">Corpus Context Issue</span> (needs to be tied to corpus item selection)
+ <span style="color:orange;">Duplicates Issue</span> (duplicate nodes or data showing up incorrectly)
+ <span style=“color:orange;”>Root context not working</span> (no nodes returned)

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

