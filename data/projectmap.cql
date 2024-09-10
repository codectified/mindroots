// Step 1: Delete the existing Mindroots project map
MATCH (mindroots:Project {name: 'Mindroots'})-[r]->(n)
DETACH DELETE mindroots, n

// Step 2: Recreate the Mindroots project map

// Create the Mindroots central node
CREATE (mindroots:Project { name: 'Mindroots' })

// Create the core category nodes
CREATE (features:Category { name: 'Graph Database Visualization Features' }),
       (graphDB:Category { name: 'GraphDB' }),
       (content:Category { name: 'Content' }),
       (games:Category { name: 'Games' }),
       (languages:Category { name: 'Languages' }),
       (bugs:Category { name: 'Bugs' }),
       (serverAdmin:Category { name: 'Server Administration, Monitoring, and Analytics' })

// Link core categories to the Mindroots node
CREATE (mindroots)-[:HAS_CATEGORY]->(features),
       (mindroots)-[:HAS_CATEGORY]->(graphDB),
       (mindroots)-[:HAS_CATEGORY]->(content),
       (mindroots)-[:HAS_CATEGORY]->(games),
       (mindroots)-[:HAS_CATEGORY]->(languages),
       (mindroots)-[:HAS_CATEGORY]->(bugs),
       (mindroots)-[:HAS_CATEGORY]->(serverAdmin)

// Graph Database Visualization Features
CREATE (corpusScreen:Task { name: 'Corpus Library Graph Screen', status: 'Functional', color: 'green' }),
       (sandboxScreen:Task { name: 'Sandbox Graph Screen', status: 'Not Yet Implemented', color: 'red' }),
       (embeddedGraph:Task { name: 'Embedded Graph Screens', status: 'Functional', color: 'green' }),
       (sandboxAddNode:Task { name: 'Add Node', status: 'Not Yet Implemented', color: 'red' }),
       (sandboxDeleteNode:Task { name: 'Delete Node', status: 'Not Yet Implemented', color: 'red' }),
       (mobileHold:Task { name: 'Hold on Mobile', status: 'Needs testing', color: 'yellow' }),
       (rightClickWord:Task { name: 'Right-click on Word Nodes', status: 'Needs expansion', color: 'yellow' }),
       (rightClickFormRoot:Task { name: 'Right-click on Form/Root Nodes', status: 'In Progress', color: 'yellow' }),
       (infoBubble:Task { name: 'Info Bubble Adjustments', status: 'Needs tweaking', color: 'yellow' })

// Link Graph Visualization tasks
CREATE (features)-[:HAS_TASK]->(corpusScreen),
       (features)-[:HAS_TASK]->(sandboxScreen),
       (features)-[:HAS_TASK]->(embeddedGraph),
       (features)-[:HAS_TASK]->(sandboxAddNode),
       (features)-[:HAS_TASK]->(sandboxDeleteNode),
       (features)-[:HAS_TASK]->(mobileHold),
       (features)-[:HAS_TASK]->(rightClickWord),
       (features)-[:HAS_TASK]->(rightClickFormRoot),
       (features)-[:HAS_TASK]->(infoBubble)

// GraphDB
CREATE (transliterations:Task { name: 'Transliterations', status: 'In Progress', color: 'yellow', details: 'Upload from Lane database. Implement programmatic transliteration scheme.' }),
       (translations:Task { name: 'Translations', status: 'In Progress', color: 'yellow', details: 'Create a pipeline for 50,000 words in Arabic to English & Urdu.' })

// Link GraphDB tasks
CREATE (graphDB)-[:HAS_TASK]->(transliterations),
       (graphDB)-[:HAS_TASK]->(translations)

// Content
CREATE (corpora:Task { name: 'Corpora', status: 'In Progress', color: 'yellow', details: '99 Names 100% uploaded, 50% linked. Quran 1% uploaded and linked.' }),
       (articles:Task { name: 'Articles', status: 'In Progress', color: 'yellow' }),
       (gettingStarted:Task { name: 'Getting Started Article', status: 'Complete', color: 'green' }),
       (aboutArticle:Task { name: 'About Article', status: 'In Progress', color: 'yellow', details: 'Add database statistics. Tweak graph screen/buttons.' }),
       (grammaticalizationLayer:Task { name: 'Grammaticalization Layer', status: 'In Progress', color: 'yellow' }),
       (argumentLayer:Task { name: 'Argument Layer', status: 'In Progress', color: 'yellow' }),
       (etymaLayer:Task { name: 'Etymolayer', status: 'Not Yet Implemented', color: 'red' })

// Link Content tasks
CREATE (content)-[:HAS_TASK]->(corpora),
       (content)-[:HAS_TASK]->(articles),
       (articles)-[:HAS_TASK]->(gettingStarted),
       (articles)-[:HAS_TASK]->(aboutArticle),
       (articles)-[:HAS_TASK]->(grammaticalizationLayer),
       (articles)-[:HAS_TASK]->(argumentLayer),
       (articles)-[:HAS_TASK]->(etymaLayer)

// Games
CREATE (guessRoot:Task { name: 'Guess the Root', status: 'Not Yet Implemented', color: 'red' }),
       (guessForm:Task { name: 'Guess the Form', status: 'Not Yet Implemented', color: 'red' })

// Link Games tasks
CREATE (games)-[:HAS_TASK]->(guessRoot),
       (games)-[:HAS_TASK]->(guessForm)

// Languages
CREATE (arabicSupport:Task { name: 'Arabic Support', status: 'Functional', color: 'green' }),
       (urduSupport:Task { name: 'Urdu Support', status: 'In Progress', color: 'yellow' }),
       (interfaceSupport:Task { name: 'Expand Language Support to Interface', status: 'Not Yet Implemented', color: 'red' })

// Link Languages tasks
CREATE (languages)-[:HAS_TASK]->(arabicSupport),
       (languages)-[:HAS_TASK]->(urduSupport),
       (languages)-[:HAS_TASK]->(interfaceSupport)

// Bugs
CREATE (englishLabels:Task { name: 'English Labels Missing in 99 Names', status: 'In Progress', color: 'yellow' }),
       (duplicates:Task { name: 'Duplicates Issue', status: 'Not Yet Implemented', color: 'red' })

// Link Bugs tasks
CREATE (bugs)-[:HAS_TASK]->(englishLabels),
       (bugs)-[:HAS_TASK]->(duplicates)

// Server Administration, Monitoring, and Analytics
CREATE (vpnSetup:Task { name: 'Set up VPN', status: 'In Progress', color: 'yellow' }),
       (grafanaAccess:Task { name: 'Fix Grafana Access', status: 'In Progress', color: 'yellow' }),
       (fail2ban:Task { name: 'Install Fail2Ban', status: 'In Progress', color: 'yellow' }),
       (clickTracking:Task { name: 'Click Tracking', status: 'In Progress', color: 'yellow' })

// Link Server Admin, Monitoring, and Analytics tasks
CREATE (serverAdmin)-[:HAS_TASK]->(vpnSetup),
       (serverAdmin)-[:HAS_TASK]->(grafanaAccess),
       (serverAdmin)-[:HAS_TASK]->(fail2ban),
       (serverAdmin)-[:HAS_TASK]->(clickTracking)

// Interface
CREATE (menuTransformation:Task { name: 'Main Menu Transformation', status: 'Not Yet Implemented', color: 'red' }),
       (returnButton:Task { name: 'Add Return to Main Site Button', status: 'Not Yet Implemented', color: 'red' })

// Link Interface tasks
CREATE (mindroots)-[:HAS_CATEGORY]->(interface),
       (interface)-[:HAS_TASK]->(menuTransformation),
       (interface)-[:HAS_TASK]->(returnButton)