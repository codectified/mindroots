// Create the Mindroots central node
CREATE (mindroots:Project {name: 'Mindroots'})

// Create the core category nodes
CREATE (features:Category {name: 'Features'})
CREATE (graphDB:Category {name: 'GraphDB'})
CREATE (content:Category {name: 'Content'})
CREATE (games:Category {name: 'Games'})
CREATE (languages:Category {name: 'Languages'})
CREATE (bugs:Category {name: 'Bugs'})
CREATE (serverMonitoring:Category {name: 'Server Monitoring & Analytics'})

// Link the core categories to the central Mindroots node
CREATE (mindroots)-[:HAS_CATEGORY]->(features)
CREATE (mindroots)-[:HAS_CATEGORY]->(graphDB)
CREATE (mindroots)-[:HAS_CATEGORY]->(content)
CREATE (mindroots)-[:HAS_CATEGORY]->(games)
CREATE (mindroots)-[:HAS_CATEGORY]->(languages)
CREATE (mindroots)-[:HAS_CATEGORY]->(bugs)
CREATE (mindroots)-[:HAS_CATEGORY]->(serverMonitoring)

// Create and link the subcategories for Features
CREATE (sandbox:Feature {name: 'Sandbox'})
CREATE (addNode:Feature {name: 'Add Node'})
CREATE (editNode:Feature {name: 'Edit Node'})
CREATE (nodeLogic:Feature {name: 'NodeLogic (Expanding a node)'})
CREATE (nodeInfo:Feature {name: 'NodeInfo'})
CREATE (deleteNode:Feature {name: 'Deleting a Node'})
CREATE (rightClickAction:Feature {name: 'Right-click Node Action'})
CREATE (tapHoldAction:Feature {name: 'Tap or Hold Action'})
CREATE (infoBubble:Feature {name: 'Info Bubble'})
CREATE (rightClickOtherScreens:Feature {name: 'Enable Right-click Node Functionality outside Corpus Library'})

// Link the Features to their parent Features category
CREATE (features)-[:HAS_FEATURE]->(sandbox)
CREATE (features)-[:HAS_FEATURE]->(addNode)
CREATE (features)-[:HAS_FEATURE]->(editNode)
CREATE (features)-[:HAS_FEATURE]->(nodeLogic)
CREATE (features)-[:HAS_FEATURE]->(nodeInfo)
CREATE (features)-[:HAS_FEATURE]->(deleteNode)
CREATE (features)-[:HAS_FEATURE]->(rightClickAction)
CREATE (features)-[:HAS_FEATURE]->(tapHoldAction)
CREATE (features)-[:HAS_FEATURE]->(infoBubble)
CREATE (features)-[:HAS_FEATURE]->(rightClickOtherScreens)

// Create and link the subcategories for GraphDB
CREATE (transliterations:SubCategory {name: 'Transliterations'})
CREATE (translations:SubCategory {name: 'Translations'})

// Link GraphDB to subcategories
CREATE (graphDB)-[:HAS_SUBCATEGORY]->(transliterations)
CREATE (graphDB)-[:HAS_SUBCATEGORY]->(translations)

// Create and link the subcategories for Content
CREATE (corpora:SubCategory {name: 'Corpora'})
CREATE (articles:SubCategory {name: 'Articles'})

// Link Content to subcategories
CREATE (content)-[:HAS_SUBCATEGORY]->(corpora)
CREATE (content)-[:HAS_SUBCATEGORY]->(articles)

// Create and link the subcategories for Games
CREATE (guessRoot:Game {name: 'Guess the Root'})
CREATE (guessForm:Game {name: 'Guess the Form'})

// Link Games to their parent Games category
CREATE (games)-[:HAS_GAME]->(guessRoot)
CREATE (games)-[:HAS_GAME]->(guessForm)

// Create and link the subcategories for Languages
CREATE (importedText:Language {name: 'Imported Text'})
CREATE (arabicEnglishSwitch:Language {name: 'Arabic/English Switching'})

// Link Languages to their parent Languages category
CREATE (languages)-[:HAS_LANGUAGE]->(importedText)
CREATE (languages)-[:HAS_LANGUAGE]->(arabicEnglishSwitch)

// Create and link the subcategories for Bugs
CREATE (duplicatesIssue:Bug {name: 'Duplicates Issue'})

// Link Bugs to their parent Bugs category
CREATE (bugs)-[:HAS_BUG]->(duplicatesIssue)

// Create and link the subcategories for Server Monitoring & Analytics
CREATE (grafanaAccess:Monitoring {name: 'Fix Grafana Access'})
CREATE (fail2ban:Monitoring {name: 'Install Fail2Ban'})
CREATE (clickTracking:Analytics {name: 'Click Tracking'})

// Link Server Monitoring & Analytics to its subcategories
CREATE (serverMonitoring)-[:HAS_MONITORING]->(grafanaAccess)
CREATE (serverMonitoring)-[:HAS_MONITORING]->(fail2ban)
CREATE (serverMonitoring)-[:HAS_ANALYTICS]->(clickTracking)

// (Optional) Link Server Monitoring & Analytics to Mindroots
CREATE (mindroots)-[:RELATED_TO]->(serverMonitoring)