const neo4j = require('neo4j-driver');

// Recursively convert Neo4j integers to regular numbers
function convertIntegers(obj) {
  if (typeof obj === 'object' && obj !== null) {
    if ('low' in obj && 'high' in obj) {
      return neo4j.int(obj.low, obj.high).toNumber();
    }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = convertIntegers(obj[key]);
      }
    }
  }
  return obj;
}

// Format simple data from records (used for list endpoints)
function formatSimpleData(records) {
  return records.map(record => ({
    item_id: record.get('item_id'),
    arabic: record.get('arabic'),
    english: record.get('english'),
    transliteration: record.get('transliteration')
  }));
}

// Helper to add a node to the nodes array and register it in the nodeMap
function addNode(neo4jNode, idProp, nodeType, nodes, nodeMap) {
  if (!neo4jNode) return;
  const properties = convertIntegers(neo4jNode.properties);
  const nodeIdValue = properties[idProp];
  if (!nodeIdValue) return; // Skip if required property is missing

  // Normalize node type to align with GraphVisualization expectations:
  // "CorpusItem" should become "name", and all others are lowercased.
  let normalizedType = nodeType.toLowerCase();
  if (normalizedType === 'corpusitem') {
    normalizedType = 'name';
  }
  
  // Create a custom ID (e.g., 'word-123' or 'name-123')
  const uniqueId = `${normalizedType}-${nodeIdValue}`;
  const fullNode = {
    id: uniqueId,
    type: normalizedType,
    ...properties
  };

  nodes.push(fullNode);
  nodeMap[neo4jNode.elementId] = fullNode;
}

// Helper to convert a relationship into a link and add it to the links array
function addLink(rel, nodeMap, links, defaultRelType = '') {
  if (!rel) return;
  const relType = rel.type || defaultRelType;

  // Retrieve start and end node references
  const startId = rel.startNodeElementId;
  const endId = rel.endNodeElementId;
  if (!startId || !endId) return;

  const sourceNode = nodeMap[startId];
  const targetNode = nodeMap[endId];
  if (!sourceNode || !targetNode) return;

  links.push({
    source: sourceNode.id,
    target: targetNode.id,
    type: relType
  });
}

const langs = require('../config/languages');

// Builds a Cypher projection string for selected languages
function selectLanguageProps(alias = 'n') {
  return ['id: id(' + alias + ')']
    .concat(langs.map(l => `${l}: ${alias}.${l}`))
    .join(', ');
}

module.exports = {
  convertIntegers,
  formatSimpleData,
  addNode,
  addLink,
  selectLanguageProps
};