// Create the main menu node
MERGE (menu:Menu {name: 'theoption.life', route: '/', color: 'gold', node_type: 'menu'})

// Create the 'News' menu item and its subnodes
MERGE (news:MenuItem {name: 'News', route: '/project-news', color: 'red', node_type: 'menu'})
MERGE (menu)-[:HAS_ITEM]->(news)

MERGE (github:SubMenuItem {name: 'GitHub', route: 'https://github.com/codectified/mindroots/', color: 'blue', node_type: 'menu'})
MERGE (status:SubMenuItem {name: 'Project Development Status', route: '/project-overview', color: 'blue', node_type: 'menu'})
MERGE (changelog:SubMenuItem {name: 'Changelog', route: '/changelog', color: 'blue', node_type: 'menu'})

MERGE (news)-[:HAS_ITEM]->(github)
MERGE (news)-[:HAS_ITEM]->(status)
MERGE (news)-[:HAS_ITEM]->(changelog)

// Create the 'Start Here' menu item and its subnode
MERGE (start:MenuItem {name: 'Start Here', route: '/start', color: 'red', node_type: 'menu'})
MERGE (menu)-[:HAS_ITEM]->(start)

MERGE (guide:SubMenuItem {name: 'Guide', route: '/getting-started', color: 'blue', node_type: 'menu'})
MERGE (start)-[:HAS_ITEM]->(guide)

// Create the 'Library' menu item and its subnodes
MERGE (library:MenuItem {name: 'Library', route: '/corpus-menu', color: 'red', node_type: 'menu'})
MERGE (menu)-[:HAS_ITEM]->(library)

// MERGE (firstCorpus:SubMenuItem {name: 'First Corpus Item', route: '/corpus/first', color: 'blue', node_type: 'menu'})
// MERGE (secondCorpus:SubMenuItem {name: 'Second Corpus Item', route: '/corpus/second', color: 'blue', node_type: 'menu'})
// MERGE (browse:SubMenuItem {name: 'Browse', route: '/corpus/browse', color: 'blue', node_type: 'menu'})

// MERGE (library)-[:HAS_ITEM]->(firstCorpus)
// MERGE (library)-[:HAS_ITEM]->(secondCorpus)
// MERGE (library)-[:HAS_ITEM]->(browse)

// Create the 'Sandbox' menu item
MERGE (sandbox:MenuItem {name: 'Sandbox', route: '/sandbox', color: 'red', node_type: 'menu'})
MERGE (menu)-[:HAS_ITEM]->(sandbox)

// Create the 'About' menu item
MERGE (about:MenuItem {name: 'About', route: '/about', color: 'red', node_type: 'menu'})
MERGE (menu)-[:HAS_ITEM]->(about)

// Create the 'Settings' menu item
MERGE (settings:MenuItem {name: 'Settings', route: '/settings', color: 'red', node_type: 'menu'})
MERGE (menu)-[:HAS_ITEM]->(settings)