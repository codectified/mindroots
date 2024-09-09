// Create the Mindroots central node
CREATE (mindroots:Project {
  name: 'Mindroots'
})

// Create the core category nodes
CREATE (features:Category {
  name: 'Graph Database Visualization Features'
})

CREATE (graphDB:Category {
  name: 'GraphDB'
})

CREATE (content:Category {
  name: 'Content'
})

CREATE (games:Category {
  name: 'Games'
})

CREATE (languages:Category {
  name: 'Languages'
})

CREATE (bugs:Category {
  name: 'Bugs'
})

CREATE (serverMonitoring:Category {
  name: 'Server Monitoring & Analytics'
})

// Link the core categories to the central Mindroots node
CREATE (mindroots)-[:HAS_CATEGORY]->(features),
       (mindroots)-[:HAS_CATEGORY]->(graphDB),
       (mindroots)-[:HAS_CATEGORY]->(content),
       (mindroots)-[:HAS_CATEGORY]->(games),
       (mindroots)-[:HAS_CATEGORY]->(languages),
       (mindroots)-[:HAS_CATEGORY]->(bugs),
       (mindroots)-[:HAS_CATEGORY]->(serverMonitoring)

// Graph Database Visualization Features
CREATE (sandbox:Feature {
  name: 'Sandbox',
  status: 'Not Yet Implemented',
  color: 'red'
})

CREATE (addNode:Feature {
  name: 'Add Node',
  status: 'Not Yet Implemented',
  color: 'red'
})

CREATE (deleteNode:Feature {
  name: 'Delete Node',
  status: 'Not Yet Implemented',
  color: 'red'
})

CREATE (nodeClickLogic:Feature {
  name: 'Node Click Logic',
  status: 'Functional',
  color: 'green'
})

CREATE (rightClickWord:Feature {
  name: 'Right-Click Node Function for Word Nodes',
  status: 'Functional',
  color: 'green'
})

CREATE (rightClickFormRoot:Feature {
  name: 'Right-Click Function for Word Form & Root Nodes',
  status: 'In Progress',
  color: 'yellow'
})

// Link Graph Visualization features to Features
CREATE (features)-[:HAS_FEATURE]->(sandbox),
       (features)-[:HAS_FEATURE]->(addNode),
       (features)-[:HAS_FEATURE]->(deleteNode),
       (features)-[:HAS_FEATURE]->(nodeClickLogic),
       (features)-[:HAS_FEATURE]->(rightClickWord),
       (features)-[:HAS_FEATURE]->(rightClickFormRoot)

// GraphDB
CREATE (transliterations:SubCategory {
  name: 'Transliterations',
  details: 'Upload from Lane database. Implement a programmatic transliteration scheme.',
  status: 'In Progress',
  color: 'yellow'
})

CREATE (translations:SubCategory {
  name: 'Translations',
  details: 'Create a data pipeline for 50,000 words in Arabic to English & Urdu.',
  status: 'In Progress',
  color: 'yellow'
})

// Link GraphDB to subcategories
CREATE (graphDB)-[:HAS_SUBCATEGORY]->(transliterations),
       (graphDB)-[:HAS_SUBCATEGORY]->(translations)

// Content
CREATE (corpora:SubCategory {
  name: 'Corpora',
  details: '99 Names: 100% uploaded, 50% linked. Quran: 1% uploaded and linked.',
  status: 'In Progress',
  color: 'yellow'
})

CREATE (articles:SubCategory {
  name: 'Articles',
  status: 'In Progress',
  color: 'yellow'
})

CREATE (gettingStarted:Article {
  name: 'Getting Started',
  status: 'Complete',
  color: 'green'
})

CREATE (grammaticalizationLayer:Article {
  name: 'Grammaticalization Layer',
  status: 'In Progress',
  color: 'yellow'
})

CREATE (argumentLayer:Article {
  name: 'Argument Layer',
  status: 'In Progress',
  color: 'yellow'
})

CREATE (etymaLayer:Article {
  name: 'Etymolayer',
  status: 'Not Yet Implemented',
  color: 'red'
})

// Link Content to subcategories and articles
CREATE (content)-[:HAS_SUBCATEGORY]->(corpora),
       (content)-[:HAS_SUBCATEGORY]->(articles),
       (articles)-[:HAS_ARTICLE]->(gettingStarted),
       (articles)-[:HAS_ARTICLE]->(grammaticalizationLayer),
       (articles)-[:HAS_ARTICLE]->(argumentLayer),
       (articles)-[:HAS_ARTICLE]->(etymaLayer)

// Games
CREATE (guessRoot:Game {
  name: 'Guess the Root',
  status: 'Not Yet Implemented',
  color: 'red'
})

CREATE (guessForm:Game {
  name: 'Guess the Form',
  status: 'Not Yet Implemented',
  color: 'red'
})

// Link Games to their parent Games category
CREATE (games)-[:HAS_GAME]->(guessRoot),
       (games)-[:HAS_GAME]->(guessForm)

// Languages
CREATE (arabicSupport:Language {
  name: 'Arabic Support',
  status: 'Functional',
  color: 'green'
})

CREATE (urduSupport:Language {
  name: 'Urdu Support',
  status: 'In Progress',
  color: 'yellow'
})

CREATE (interfaceSupport:Language {
  name: 'Expand Language Functionality to Interface',
  status: 'Not Yet Implemented',
  color: 'red'
})

// Link Languages to their parent Languages category
CREATE (languages)-[:HAS_LANGUAGE]->(arabicSupport),
       (languages)-[:HAS_LANGUAGE]->(urduSupport),
       (languages)-[:HAS_LANGUAGE]->(interfaceSupport)

// Bugs
CREATE (englishLabelMissing:Bug {
  name: 'English Labels Missing for 99 Names (Roots)',
  status: 'In Progress',
  color: 'yellow'
})

// Link Bugs to their parent Bugs category
CREATE (bugs)-[:HAS_BUG]->(englishLabelMissing)

// Server Monitoring & Analytics
CREATE (grafanaAccess:Monitoring {
  name: 'Fix Grafana Access',
  status: 'In Progress',
  color: 'yellow'
})

CREATE (fail2ban:Monitoring {
  name: 'Install Fail2Ban',
  status: 'In Progress',
  color: 'yellow'
})

CREATE (clickTracking:Analytics {
  name: 'Click Tracking',
  status: 'In Progress',
  color: 'yellow'
})

// Link Server Monitoring & Analytics to its subcategories
CREATE (serverMonitoring)-[:HAS_MONITORING]->(grafanaAccess),
       (serverMonitoring)-[:HAS_MONITORING]->(fail2ban),
       (serverMonitoring)-[:HAS_ANALYTICS]->(clickTracking)

// (Optional) Link Server Monitoring & Analytics to Mindroots
CREATE (mindroots)-[:RELATED_TO]->(serverMonitoring)