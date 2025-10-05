const express = require('express');
const { convertIntegers } = require('./utils');
const router = express.Router();

// Node Inspector - Get comprehensive corpus item information (specific endpoint for corpus items)
router.get('/inspect/corpusitem/:corpusId/:itemId', async (req, res) => {
  try {
    const { corpusId, itemId } = req.params;
    const session = req.driver.session();
    
    // Determine if this is a hierarchical ID (contains ':')
    const isHierarchicalId = itemId.includes(':');
    const isCorpus2 = parseInt(corpusId) === 2;
    
    // Query to get corpus item properties and relationship counts
    const query = isHierarchicalId && isCorpus2 ? `
      MATCH (n:CorpusItem {corpus_id: toInteger($corpusId), item_id: $itemId})
      
      // Get all node properties
      WITH n, keys(n) as propertyKeys
      
      // Get relationship counts by type and direction
      OPTIONAL MATCH (n)-[r]->(target)
      WITH n, propertyKeys, type(r) as outRelType, count(target) as outCount
      WITH n, propertyKeys, collect({type: outRelType, direction: 'outgoing', count: outCount}) as outgoingRels
      
      OPTIONAL MATCH (source)-[r]->(n)
      WITH n, propertyKeys, outgoingRels, type(r) as inRelType, count(source) as inCount
      WITH n, propertyKeys, outgoingRels, collect({type: inRelType, direction: 'incoming', count: inCount}) as incomingRels
      
      // Get connected node type counts
      OPTIONAL MATCH (n)-[:HAS_WORD]->(w:Word)
      WITH n, propertyKeys, outgoingRels, incomingRels, count(w) as wordCount
      
      OPTIONAL MATCH (n)<-[:BELONGS_TO]-(c:Corpus)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, count(c) as corpusCount
      
      RETURN n, 
             propertyKeys,
             outgoingRels + incomingRels as relationships,
             {
               words: wordCount,
               corpora: corpusCount
             } as connectedCounts
    ` : `
      MATCH (n:CorpusItem {corpus_id: toInteger($corpusId), item_id: toInteger($itemId)})
      
      // Get all node properties
      WITH n, keys(n) as propertyKeys
      
      // Get relationship counts by type and direction
      OPTIONAL MATCH (n)-[r]->(target)
      WITH n, propertyKeys, type(r) as outRelType, count(target) as outCount
      WITH n, propertyKeys, collect({type: outRelType, direction: 'outgoing', count: outCount}) as outgoingRels
      
      OPTIONAL MATCH (source)-[r]->(n)
      WITH n, propertyKeys, outgoingRels, type(r) as inRelType, count(source) as inCount
      WITH n, propertyKeys, outgoingRels, collect({type: inRelType, direction: 'incoming', count: inCount}) as incomingRels
      
      // Get connected node type counts
      OPTIONAL MATCH (n)-[:HAS_WORD]->(w:Word)
      WITH n, propertyKeys, outgoingRels, incomingRels, count(w) as wordCount
      
      OPTIONAL MATCH (n)<-[:BELONGS_TO]-(c:Corpus)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, count(c) as corpusCount
      
      RETURN n, 
             propertyKeys,
             outgoingRels + incomingRels as relationships,
             {
               words: wordCount,
               corpora: corpusCount
             } as connectedCounts
    `;
    
    const result = await session.run(query, { 
      corpusId: parseInt(corpusId), 
      itemId: isHierarchicalId && isCorpus2 ? itemId : parseInt(itemId)
    });
    
    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: `No CorpusItem found with corpus_id: ${corpusId}, item_id: ${itemId}` 
      });
    }
    
    const record = result.records[0];
    const node = record.get('n').properties;
    const propertyKeys = record.get('propertyKeys');
    const relationships = record.get('relationships');
    const connectedCounts = record.get('connectedCounts');
    
    // Convert Neo4j integers and organize data
    const nodeData = convertIntegers(node);
    const relationshipData = convertIntegers(relationships.filter(r => r.type !== null));
    const connectedData = convertIntegers(connectedCounts);
    
    // Organize properties in the format expected by NodeInspector
    const organizedProperties = {};
    propertyKeys.forEach(key => {
      const value = nodeData[key];
      organizedProperties[key] = {
        value: value,
        type: typeof value,
        isEmpty: value === null || value === undefined || value === ''
      };
    });
    
    await session.close();
    
    res.json({
      nodeType: 'CorpusItem',
      nodeId: `${corpusId}_${itemId}`,
      properties: organizedProperties,
      relationships: relationshipData,
      connectedNodeCounts: connectedData,
      summary: {
        totalProperties: propertyKeys.length,
        totalRelationships: relationshipData.reduce((sum, r) => sum + r.count, 0),
        totalConnectedNodes: Object.values(connectedData).reduce((sum, count) => sum + count, 0)
      }
    });
    
  } catch (error) {
    console.error('Error in corpus item inspect endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Node Inspector - Get comprehensive node information (for other node types)
router.get('/inspect/:nodeType/:nodeId', async (req, res) => {
  try {
    const { nodeType, nodeId } = req.params;
    const session = req.driver.session();
    
    // Validate node type
    const validNodeTypes = ['Root', 'Word', 'Form', 'CorpusItem'];
    // Map input node types to proper case
    const nodeTypeMap = {
      'root': 'Root',
      'word': 'Word', 
      'form': 'Form',
      'corpusitem': 'CorpusItem'
    };
    const capitalizedNodeType = nodeTypeMap[nodeType.toLowerCase()] || nodeType;
    
    if (!validNodeTypes.includes(capitalizedNodeType)) {
      return res.status(400).json({ 
        error: `Invalid node type: ${nodeType}. Valid types: ${validNodeTypes.join(', ')}` 
      });
    }
    
    // Determine the ID property name based on node type
    let idProperty;
    switch (capitalizedNodeType) {
      case 'Root': idProperty = 'root_id'; break;
      case 'Word': idProperty = 'word_id'; break;
      case 'Form': idProperty = 'form_id'; break;
      case 'CorpusItem': idProperty = 'item_id'; break;
    }
    
    // Query to get node properties and relationship counts
    const query = `
      MATCH (n:${capitalizedNodeType} {${idProperty}: toInteger($nodeId)})
      
      // Get all node properties
      WITH n, keys(n) as propertyKeys
      
      // Get relationship counts by type and direction
      OPTIONAL MATCH (n)-[r]->(target)
      WITH n, propertyKeys, type(r) as outRelType, count(target) as outCount
      WITH n, propertyKeys, collect({type: outRelType, direction: 'outgoing', count: outCount}) as outgoingRels
      
      OPTIONAL MATCH (source)-[r]->(n)
      WITH n, propertyKeys, outgoingRels, type(r) as inRelType, count(source) as inCount
      WITH n, propertyKeys, outgoingRels, collect({type: inRelType, direction: 'incoming', count: inCount}) as incomingRels
      
      // Get connected node type counts
      OPTIONAL MATCH (n)-[:HAS_WORD]->(w:Word)
      WITH n, propertyKeys, outgoingRels, incomingRels, count(w) as wordCount
      
      OPTIONAL MATCH (n)-[:HAS_FORM]->(f:Form)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, count(f) as formCount
      
      OPTIONAL MATCH (n)<-[:HAS_WORD]-(r:Root)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, formCount, count(r) as rootCount
      
      OPTIONAL MATCH (n)-[:HAS_RADICAL]->(rp:RadicalPosition)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, formCount, rootCount, count(rp) as radicalCount
      
      OPTIONAL MATCH (n)-[:BELONGS_TO]->(c:Corpus)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, formCount, rootCount, radicalCount, count(c) as corpusCount
      
      RETURN n, 
             propertyKeys,
             outgoingRels + incomingRels as relationships,
             {
               words: wordCount,
               forms: formCount, 
               roots: rootCount,
               radicals: radicalCount,
               corpora: corpusCount
             } as connectedCounts
    `;
    
    const result = await session.run(query, { nodeId: parseInt(nodeId) });
    
    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: `No ${capitalizedNodeType} found with ID: ${nodeId}` 
      });
    }
    
    const record = result.records[0];
    const node = record.get('n').properties;
    const propertyKeys = record.get('propertyKeys');
    const relationships = record.get('relationships');
    const connectedCounts = record.get('connectedCounts');
    
    // Convert Neo4j integers and organize data
    const nodeData = convertIntegers(node);
    const relationshipData = convertIntegers(relationships.filter(r => r.type !== null));
    const connectedData = convertIntegers(connectedCounts);
    
    // Organize properties by type
    const organizedProperties = {};
    propertyKeys.forEach(key => {
      const value = nodeData[key];
      organizedProperties[key] = {
        value: value,
        type: typeof value,
        isEmpty: value === null || value === undefined || value === ''
      };
    });
    
    await session.close();
    
    res.json({
      nodeType: capitalizedNodeType,
      nodeId: parseInt(nodeId),
      properties: organizedProperties,
      relationships: relationshipData,
      connectedNodeCounts: connectedData,
      summary: {
        totalProperties: propertyKeys.length,
        totalRelationships: relationshipData.reduce((sum, r) => sum + r.count, 0),
        totalConnectedNodes: Object.values(connectedData).reduce((sum, count) => sum + count, 0)
      }
    });
    
  } catch (error) {
    console.error('Error in node inspection:', error);
    res.status(500).json({ 
      error: 'Error inspecting node',
      message: error.message 
    });
  }
});

// Navigation endpoints for NodeInspector
router.get('/navigate/word/:wordId/:direction', async (req, res) => {
  const session = req.driver.session();
  const { wordId, direction } = req.params;
  
  try {
    const currentId = parseInt(wordId);
    
    // Find the next/previous word that actually exists
    const query = direction === 'next' 
      ? `
        MATCH (w:Word) 
        WHERE toInteger(w.word_id) > $currentId
        RETURN w
        ORDER BY toInteger(w.word_id) ASC
        LIMIT 1
      `
      : `
        MATCH (w:Word) 
        WHERE toInteger(w.word_id) < $currentId
        RETURN w
        ORDER BY toInteger(w.word_id) DESC
        LIMIT 1
      `;
    
    const result = await session.run(query, { currentId });
    
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // If word exists, get full inspection data
    const wordNode = result.records[0].get('w');
    const nodeId = wordNode.identity.toNumber();
    
    // Reuse the inspection logic
    const inspectQuery = `
      MATCH (n) WHERE id(n) = $nodeId
      OPTIONAL MATCH (n)-[r]-(connected)
      RETURN n, 
             type(r) as rel_type, 
             startNode(r) = n as is_outgoing,
             count(connected) as rel_count,
             labels(connected)[0] as connected_type
    `;
    
    const inspectResult = await session.run(inspectQuery, { nodeId });
    
    // Process inspection data (same logic as /inspect endpoint)
    const nodeData = inspectResult.records[0].get('n');
    const nodeProperties = nodeData.properties;
    const nodeLabels = nodeData.labels;
    
    const propertyKeys = Object.keys(nodeProperties);
    const properties = {};
    
    propertyKeys.forEach(key => {
      const value = nodeProperties[key];
      const isEmpty = value === null || value === undefined || value === '';
      properties[key] = {
        value: convertIntegers(value),
        type: isEmpty ? 'empty' : typeof value,
        isEmpty
      };
    });
    
    // Process relationships
    const relationshipMap = new Map();
    const connectedNodeTypes = {};
    
    inspectResult.records.forEach(record => {
      const relType = record.get('rel_type');
      const isOutgoing = record.get('is_outgoing');
      const relCount = record.get('rel_count');
      const connectedType = record.get('connected_type');
      
      if (relType) {
        const direction = isOutgoing ? 'outgoing' : 'incoming';
        const key = `${relType}_${direction}`;
        
        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, { type: relType, direction, count: 0 });
        }
        relationshipMap.get(key).count += relCount.toNumber();
        
        if (connectedType) {
          connectedNodeTypes[connectedType.toLowerCase()] = (connectedNodeTypes[connectedType.toLowerCase()] || 0) + relCount.toNumber();
        }
      }
    });
    
    const relationships = Array.from(relationshipMap.values());
    
    res.json({
      nodeData: {
        nodeType: nodeLabels[0],
        nodeId: convertIntegers(nodeProperties.word_id || nodeId),
        properties,
        relationships,
        connectedNodeCounts: connectedNodeTypes,
        summary: {
          totalProperties: propertyKeys.length,
          totalRelationships: relationships.reduce((sum, r) => sum + r.count, 0),
          totalConnectedNodes: Object.values(connectedNodeTypes).reduce((sum, count) => sum + count, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error navigating word:', error);
    res.status(500).json({ 
      error: 'Error navigating to adjacent word',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

router.get('/navigate/corpusitem/:corpusId/:itemId/:direction', async (req, res) => {
  const session = req.driver.session();
  const { corpusId, itemId, direction } = req.params;
  
  try {
    const currentCorpusId = parseInt(corpusId);
    const isHierarchicalId = itemId.includes(':');
    const isCorpus2 = currentCorpusId === 2;
    
    let query, queryParams;
    
    if (isHierarchicalId && isCorpus2) {
      // Hierarchical ID logic for Corpus 2
      const [currentSurah, currentAyah, currentWord] = itemId.split(':').map(Number);
      
      query = direction === 'next' 
        ? `
          MATCH (c:CorpusItem) 
          WHERE toInteger(c.corpus_id) = $corpusId
          WITH c, split(c.item_id, ':') as parts
          WITH c, toInteger(parts[0]) as surah, toInteger(parts[1]) as ayah, toInteger(parts[2]) as word
          WHERE (
            surah > $currentSurah OR
            (surah = $currentSurah AND ayah > $currentAyah) OR  
            (surah = $currentSurah AND ayah = $currentAyah AND word > $currentWord)
          )
          RETURN c
          ORDER BY surah, ayah, word
          LIMIT 1
        `
        : `
          MATCH (c:CorpusItem) 
          WHERE toInteger(c.corpus_id) = $corpusId
          WITH c, split(c.item_id, ':') as parts
          WITH c, toInteger(parts[0]) as surah, toInteger(parts[1]) as ayah, toInteger(parts[2]) as word
          WHERE (
            surah < $currentSurah OR
            (surah = $currentSurah AND ayah < $currentAyah) OR
            (surah = $currentSurah AND ayah = $currentAyah AND word < $currentWord)
          )
          RETURN c
          ORDER BY surah DESC, ayah DESC, word DESC
          LIMIT 1
        `;
      
      queryParams = { 
        corpusId: currentCorpusId, 
        currentSurah,
        currentAyah,
        currentWord
      };
      
    } else {
      // Integer ID logic for Corpus 1&3
      const currentItemId = parseInt(itemId);
      
      query = direction === 'next' 
        ? `
          MATCH (c:CorpusItem) 
          WHERE toInteger(c.corpus_id) = $corpusId AND toInteger(c.item_id) > $currentItemId
          RETURN c
          ORDER BY toInteger(c.item_id)
          LIMIT 1
        `
        : `
          MATCH (c:CorpusItem) 
          WHERE toInteger(c.corpus_id) = $corpusId AND toInteger(c.item_id) < $currentItemId
          RETURN c
          ORDER BY toInteger(c.item_id) DESC
          LIMIT 1
        `;
      
      queryParams = { 
        corpusId: currentCorpusId, 
        currentItemId
      };
    }
    
    const result = await session.run(query, queryParams);
    
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // If corpus item exists, get full inspection data
    const corpusItemNode = result.records[0].get('c');
    const nodeId = corpusItemNode.identity.toNumber();
    
    // Reuse the inspection logic
    const inspectQuery = `
      MATCH (n) WHERE id(n) = $nodeId
      OPTIONAL MATCH (n)-[r]-(connected)
      RETURN n, 
             type(r) as rel_type, 
             startNode(r) = n as is_outgoing,
             count(connected) as rel_count,
             labels(connected)[0] as connected_type
    `;
    
    const inspectResult = await session.run(inspectQuery, { nodeId });
    
    // Process inspection data (same logic as /inspect endpoint)
    const nodeData = inspectResult.records[0].get('n');
    const nodeProperties = nodeData.properties;
    const nodeLabels = nodeData.labels;
    
    const propertyKeys = Object.keys(nodeProperties);
    const properties = {};
    
    propertyKeys.forEach(key => {
      const value = nodeProperties[key];
      const isEmpty = value === null || value === undefined || value === '';
      properties[key] = {
        value: convertIntegers(value),
        type: isEmpty ? 'empty' : typeof value,
        isEmpty
      };
    });
    
    // Process relationships
    const relationshipMap = new Map();
    const connectedNodeTypes = {};
    
    inspectResult.records.forEach(record => {
      const relType = record.get('rel_type');
      const isOutgoing = record.get('is_outgoing');
      const relCount = record.get('rel_count');
      const connectedType = record.get('connected_type');
      
      if (relType) {
        const direction = isOutgoing ? 'outgoing' : 'incoming';
        const key = `${relType}_${direction}`;
        
        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, { type: relType, direction, count: 0 });
        }
        relationshipMap.get(key).count += relCount.toNumber();
        
        if (connectedType) {
          connectedNodeTypes[connectedType.toLowerCase()] = (connectedNodeTypes[connectedType.toLowerCase()] || 0) + relCount.toNumber();
        }
      }
    });
    
    const relationships = Array.from(relationshipMap.values());
    
    res.json({
      nodeData: {
        nodeType: nodeLabels[0],
        nodeId: convertIntegers(nodeProperties.item_id || nodeId),
        properties,
        relationships,
        connectedNodeCounts: connectedNodeTypes,
        summary: {
          totalProperties: propertyKeys.length,
          totalRelationships: relationships.reduce((sum, r) => sum + r.count, 0),
          totalConnectedNodes: Object.values(connectedNodeTypes).reduce((sum, count) => sum + count, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error navigating corpus item:', error);
    res.status(500).json({ 
      error: 'Error navigating to adjacent corpus item',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Navigation by global_position (more reliable for Quran/hierarchical data)
router.get('/navigate-by-position/:corpusId/:globalPosition/:direction', async (req, res) => {
  const session = req.driver.session();
  const { corpusId, globalPosition, direction } = req.params;
  
  try {
    const currentCorpusId = parseInt(corpusId);
    const currentGlobalPosition = parseInt(globalPosition);
    
    // Simple query using global_position for navigation
    const query = direction === 'next' 
      ? `
        MATCH (c:CorpusItem) 
        WHERE toInteger(c.corpus_id) = $corpusId 
          AND toInteger(c.global_position) > $currentGlobalPosition
        RETURN c
        ORDER BY toInteger(c.global_position)
        LIMIT 1
      `
      : `
        MATCH (c:CorpusItem) 
        WHERE toInteger(c.corpus_id) = $corpusId 
          AND toInteger(c.global_position) < $currentGlobalPosition
        RETURN c
        ORDER BY toInteger(c.global_position) DESC
        LIMIT 1
      `;
    
    const queryParams = { 
      corpusId: currentCorpusId, 
      currentGlobalPosition
    };
    
    const result = await session.run(query, queryParams);
    
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // If corpus item exists, get full inspection data
    const corpusItemNode = result.records[0].get('c');
    const nodeId = corpusItemNode.identity.toNumber();
    
    // Reuse the inspection logic from the existing endpoint
    const inspectQuery = `
      MATCH (n) WHERE id(n) = $nodeId
      OPTIONAL MATCH (n)-[r]-(connected)
      RETURN n, 
             type(r) as rel_type, 
             startNode(r) = n as is_outgoing,
             count(connected) as rel_count,
             labels(connected) as connected_labels
    `;
    
    const inspectResult = await session.run(inspectQuery, { nodeId });
    
    if (inspectResult.records.length === 0) {
      return res.status(404).json({ error: 'Node not found in inspection' });
    }
    
    // Process inspection results (same as existing endpoint)
    const nodeRecord = inspectResult.records[0];
    const nodeData = nodeRecord.get('n');
    const nodeProperties = convertIntegers(nodeData.properties);
    const nodeLabels = nodeData.labels;
    const propertyKeys = Object.keys(nodeProperties);
    
    // Organize properties
    const properties = {};
    propertyKeys.forEach(key => {
      const value = nodeProperties[key];
      properties[key] = {
        value: value,
        type: typeof value,
        isEmpty: value === null || value === undefined || value === ''
      };
    });
    
    // Build relationships and connected node counts
    const relationshipMap = new Map();
    const connectedNodeTypes = {};
    
    inspectResult.records.forEach(record => {
      const relType = record.get('rel_type');
      const isOutgoing = record.get('is_outgoing');
      const relCount = convertIntegers(record.get('rel_count'));
      const connectedLabels = record.get('connected_labels') || [];
      
      if (relType) {
        const direction = isOutgoing ? 'outgoing' : 'incoming';
        const key = `${relType}_${direction}`;
        
        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, {
            type: relType,
            direction: direction,
            count: 0
          });
        }
        
        relationshipMap.get(key).count += relCount;
        
        // Count connected node types
        connectedLabels.forEach(label => {
          connectedNodeTypes[label] = (connectedNodeTypes[label] || 0) + relCount;
        });
      }
    });
    
    const relationships = Array.from(relationshipMap.values());
    
    res.json({
      nodeData: {
        nodeType: nodeLabels[0],
        nodeId: convertIntegers(nodeProperties.item_id || nodeId),
        properties,
        relationships,
        connectedNodeCounts: connectedNodeTypes,
        summary: {
          totalProperties: propertyKeys.length,
          totalRelationships: relationships.reduce((sum, r) => sum + r.count, 0),
          totalConnectedNodes: Object.values(connectedNodeTypes).reduce((sum, count) => sum + count, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error navigating by global position:', error);
    res.status(500).json({ 
      error: 'Error navigating by global position',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Update validation fields for a node
router.post('/update-validation/:nodeType/:nodeId', async (req, res) => {
  const session = req.driver.session();
  const { nodeType, nodeId } = req.params;
  const { updates } = req.body; // { field_name: { value: "new_value", approve: true }, ... }
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // Validate node type
    const validNodeTypes = ['word', 'root', 'form', 'corpusitem'];
    if (!validNodeTypes.includes(nodeType.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid node type' });
    }
    
    // Get the node first to verify it exists - use only the property-based lookup
    const nodeQuery = `MATCH (n:${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}) WHERE n.${nodeType}_id = $nodeId RETURN n`;
    const nodeResult = await session.run(nodeQuery, { nodeId: parseInt(nodeId) });
    
    if (nodeResult.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const node = nodeResult.records[0].get('n');
    const actualNodeId = node.identity.toNumber();
    
    // Process each field update sequentially to avoid transaction conflicts
    for (const [fieldName, updateData] of Object.entries(updates)) {
      if (updateData.value !== undefined) {
        // Update field value
        const updateValueQuery = `
          MATCH (n) WHERE id(n) = $nodeId
          SET n.${fieldName} = $value
          RETURN n
        `;
        await session.run(updateValueQuery, { 
          nodeId: actualNodeId, 
          value: updateData.value 
        });
      }
      
      if (updateData.approve === true) {
        // Check for recent approval from same IP (basic spam protection)
        const recentApprovalQuery = `
          MATCH (n)-[:APPROVED_BY]->(approval:Approval)
          WHERE id(n) = $nodeId 
          AND approval.field = $fieldName 
          AND approval.ip = $ip 
          AND approval.timestamp > datetime() - duration('PT24H')
          RETURN approval LIMIT 1
        `;
        
        const recentResult = await session.run(recentApprovalQuery, {
          nodeId: actualNodeId,
          fieldName: fieldName,
          ip: clientIP
        });
        
        if (recentResult.records.length > 0) {
          continue; // Skip this approval - IP already approved in last 24h
        }
        
        // Create approval record and increment counter
        const approvalQuery = `
          MATCH (n) WHERE id(n) = $nodeId
          CREATE (n)-[:APPROVED_BY]->(approval:Approval {
            field: $fieldName,
            ip: $ip,
            timestamp: datetime(),
            value: $value
          })
          SET n.${fieldName}_validated_count = COALESCE(n.${fieldName}_validated_count, 0) + 1
          RETURN n
        `;
        
        await session.run(approvalQuery, {
          nodeId: actualNodeId,
          fieldName: fieldName,
          ip: clientIP,
          value: updateData.value || ''
        });
      }
    }
    
    // Return updated node data
    const finalQuery = `MATCH (n) WHERE id(n) = $nodeId RETURN n`;
    const finalResult = await session.run(finalQuery, { nodeId: actualNodeId });
    const updatedNode = finalResult.records[0].get('n').properties;
    
    res.json({
      success: true,
      message: `Updated ${Object.keys(updates).length} fields`,
      nodeData: convertIntegers(updatedNode)
    });
    
  } catch (error) {
    console.error('Error updating validation fields:', error);
    res.status(500).json({ 
      error: 'Error updating validation fields',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

module.exports = router;