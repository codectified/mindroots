# Project Task Organization

## Table of Contents
- [Overview](#overview)
- [Feature Areas](#feature-areas)
  - [General Graph Screen Functionality](#general-graph-screen-functionality)
  - [GraphDB Expansion](#graphdb-expansion)
  - [Embedded Graph Screens](#embedded-graph-screens)
  - [Library Expansion](#library-expansion)
  - [Games Development](#games-development)
  - [Interface Enhancements](#interface-enhancements)
  - [Server Administration](#server-administration)
  - [Monitoring & Analytics](#monitoring--analytics)
  - [Bugs and Issues](#bugs-and-issues)
  - [Graph Visualization Improvements](#graph-visualization-improvements)
- [Contributions](#contributions)
- [Additional Considerations](#additional-considerations)

## Overview
This document outlines the current status of the Mindroots project, highlighting ongoing tasks, backlog items, and known issues. Contributions are welcome, with areas of expertise required highlighted in the **Contributions** section.  

---

## Feature Areas

### **General Graph Screen Functionality**
Core functionalities related to the graph screen experience.

  - Clear screen: Not yet implemented.
  - Isolate node/clear all but: Not yet implemented.
  - Scroll results when over limit: Not yet implemented.
  - Node limit control: Not yet implemented.
  - Deleting Nodes: Not yet implemented.
  - Secondary action for nodes: Completed for word nodes to display InfoBubble; word and form nodes, not started.
  - Subcontext menu: Needs consolidation into a menu with options (Lane, Hand-Wehr, synonyms, corpus locations, collocations, and statistics).
  - Node shades: Add color shades to indicate weight/productivity/incidence/type (verbs darker, nouns lighter; greater incidence darker, less incidence lighter).
  - User-submitted usage examples: Not yet implemented.

### **GraphDB Expansion**
Tasks related to data processing and language integration.

  - Upload from transliterations Lane database: Pending evaluation; schema is strange.
  - Implement a programmatic transliteration scheme: Pending (Python).
  - Target languages: English and Urdu.
  - form analaysis: completed for 19 demo words from the 99 names corpus; needs to be automated for entire lexicon.
  - Create a data pipeline for handling 50,000 words with LLM: In progress; OpenAI API costs need estimates.


### **Embedded Graph Screens**
Static page-related features and improvements.

  - Rendering markdown and graphs on static pages: Needs redesign. (About and Getting Started pages)

### **Library Expansion**
Tasks associated with expanding the content library and linking resources.

  - Add Quran and Hadith and link to lexicon: Not started.
  - Graph layers overview articles: Not started.
  - Add graph database statistics articles (e.g., number of words, roots, etc.): Not started.
  - Tweak buttons and placement of the graph screen and buttons: Not started.

### **Games Development**
Interactive features to engage users with the graph content.

  - Guess the Root: Not yet implemented.
  - Guess the Form: Not yet implemented.

### **Interface Enhancements**
UI/UX improvements to enhance user interaction.

  - Main Menu Transformation: Not yet implemented.
  - Add a button to return to the main site and exit the application: Not yet implemented.

### **Server Administration**
Server-related tasks to maintain and secure the project environment.

  - Set up VPN (OpenVPN) on the server to enable updates via mobile device: Complete.

### **Monitoring & Analytics**
Tasks focused on monitoring user interactions and analyzing application performance.

  - Install Fail2Ban: Security setup needed.
  - Explore tools for first-click analysis: Currently using Prometheus with Grafana; needs setup.

### **Bugs and Issues**
Known issues that need resolution.

- **Corpus Context Issue:**
  - Context is lost or not cached when revisiting the screen; needs to be tied to corpus item selection.
- **Duplicates Issue:**
  - Duplicate nodes or data showing up incorrectly.
- **Missing English Labels:**
  - English labels missing for most words in the 99 Names corpus (linked to translations task above).

### **Graph Visualization Improvements**
Enhancements for improving the visual experience and functionality of the graph.

- **Force graph physics:**
  - Slow node movement.
  - Fix alignment.
  - Stop unnecessary movements.
  - Resize graph screen.

---

## Contributions

We welcome contributions from developers and researchers interested in enhancing the Mindroots project. Below are the areas of expertise required for incomplete tasks:

### **General Graph Screen Functionality**
   - **Expertise Required**: JavaScript, D3.js, UX/UI Design.

### **GraphDB Transliterations and Translations**
   - **Expertise Required**: Python, Natural Language Processing, API Integration.

### **Library Expansion**
   - **Expertise Required**: Neo4j, Content Management, Lexicography.

### **Games Development**
   - **Expertise Required**: Game Design, JavaScript, Educational Tools.

### **Monitoring & Analytics**
   - **Expertise Required**: DevOps, Security, Monitoring Tools (Prometheus, Grafana).

### **General UI/UX Improvements**
   - **Expertise Required**: UI/UX Design, Frontend Development, User Testing.

---

## Additional Considerations

While this README is somewhat unconventional, it provides a structured view of the project's tasks and invites collaboration in a focused manner. 


# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
