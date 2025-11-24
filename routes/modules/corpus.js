const express = require('express');
const { convertIntegers, formatSimpleData } = require('./utils');
const router = express.Router();

// List Quran items by corpus and sura
router.get('/list/quran_items', async (req, res) => {
  const { corpus_id, sura_index } = req.query;
  if (!corpus_id || !sura_index) {
    return res.status(400).send('Missing parameters');
  }

  const session = req.driver.session();
  try {
    // Handle different corpus schemas
    let result;
    if (corpus_id === '2') {
      // Corpus 2: Hierarchical IDs (surah:ayah:word) with s1_ prefixed properties
      result = await session.run(`
        MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
        WITH item, split(item.item_id, ':') as parts
        WHERE toInteger(parts[0]) = toInteger($sura_index)
        RETURN 
          item.sem AS arabic,  /* Use sem as full word display */
          item.transliteration AS transliteration, 
          item.item_id AS item_id,
          toInteger(parts[1]) AS aya_index,
          item.english AS english,
          item.sem AS sem,
          item.s1_tag AS pos,
          item.gender AS gender,
          toInteger(parts[0]) AS surah,
          toInteger(parts[1]) AS ayah,
          toInteger(parts[2]) AS word
        ORDER BY toInteger(parts[1]), toInteger(parts[2])
      `, { corpus_id, sura_index });
    } else {
      // Corpus 1 & 3: Sequential integer IDs - just return all items (no sura filtering)
      result = await session.run(`
        MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
        RETURN 
          item.arabic AS arabic, 
          item.transliteration AS transliteration, 
          toInteger(item.item_id) AS item_id,
          0 AS aya_index,  /* Default aya_index */
          item.english AS english,
          item.sem AS sem,
          item.part_of_speech AS pos,
          item.gender AS gender
        ORDER BY item.item_id
        LIMIT 50
      `, { corpus_id });
    }

    const quranItems = result.records.map(record => record.toObject());
    res.json(quranItems);
  } catch (error) {
    console.error('Error fetching Quran items:', error);
    res.status(500).send('Error fetching Quran items');
  } finally {
    await session.close();
  }
});

// Optimized endpoint for Quran items with aya range support
router.get('/list/quran_items_range', async (req, res) => {
  const { corpus_id, sura_index, start_aya, end_aya } = req.query;
  if (!corpus_id || !sura_index) {
    return res.status(400).send('Missing required parameters: corpus_id, sura_index');
  }

  const session = req.driver.session();
  try {
    let query, params = { corpus_id, sura_index };
    
    if (corpus_id === '2') {
      // Corpus 2: Hierarchical IDs (surah:ayah:word)
      query = `
        MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
        WITH item, split(item.item_id, ':') as parts
        WHERE toInteger(parts[0]) = toInteger($sura_index)
      `;
      
      // Add aya range filtering if specified  
      if (start_aya && end_aya) {
        query += ` AND toInteger(parts[1]) >= toInteger($start_aya) AND toInteger(parts[1]) <= toInteger($end_aya)`;
        params.start_aya = start_aya;
        params.end_aya = end_aya;
      } else if (start_aya) {
        query += ` AND toInteger(parts[1]) >= toInteger($start_aya)`;
        params.start_aya = start_aya;
      } else if (end_aya) {
        query += ` AND toInteger(parts[1]) <= toInteger($end_aya)`;
        params.end_aya = end_aya;
      }
      
      query += `
        RETURN 
          item.sem AS arabic,  /* Use sem for full word display */
          item.transliteration AS transliteration, 
          item.item_id AS item_id,
          toInteger(parts[1]) AS aya_index,
          item.english AS english,
          item.sem AS sem,
          item.s1_tag AS pos,
          item.gender AS gender,
          toInteger(parts[0]) AS sura_index,
          toInteger(parts[0]) AS surah,
          toInteger(parts[1]) AS ayah,
          toInteger(parts[2]) AS word
        ORDER BY toInteger(parts[1]), toInteger(parts[2])
      `;
    } else {
      // Corpus 1 & 3: Sequential integer IDs - no sura/aya structure
      query = `
        MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
        RETURN 
          item.arabic AS arabic, 
          item.transliteration AS transliteration, 
          toInteger(item.item_id) AS item_id,
          0 AS aya_index,  /* Default aya_index */
          item.english AS english,
          item.sem AS sem,
          item.part_of_speech AS pos,
          item.gender AS gender,
          toInteger($corpus_id) AS sura_index
        ORDER BY item.item_id
        LIMIT 50
      `;
    }

    const result = await session.run(query, params);
    const quranItems = result.records.map(record => convertIntegers(record.toObject()));
    res.json(quranItems);
  } catch (error) {
    console.error('Error fetching Quran items with range:', error);
    res.status(500).send('Error fetching Quran items with range');
  } finally {
    await session.close();
  }
});

// Endpoint to fetch poetry items by corpus_id
router.get('/list/poetry_items', async (req, res) => {
  const { corpus_id } = req.query;

  if (!corpus_id) {
    return res.status(400).send('Missing corpus_id parameter');
  }

  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
      RETURN 
        item.arabic AS arabic,
        item.transliteration AS transliteration,
        item.sem AS sem,
        toInteger(item.item_id) AS item_id,  /* Convert item_id */
        item.lemma AS lemma,
        item.wazn AS wazn,
        item.part_of_speech AS pos,
        item.gender AS gender,
        item.number AS number,
        item.case AS case,
        item.prefix AS prefix,
        item.suffix AS suffix,
        toInteger(item.line_number) AS line_number,
        toInteger(item.word_position) AS word_position
      ORDER BY item.line_number, item.item_id
    `, { corpus_id });

    const poetryItems = result.records.map(record => convertIntegers(record.toObject()));
    res.json(poetryItems);
  } catch (error) {
    console.error('Error fetching poetry items:', error);
    res.status(500).send('Error fetching poetry items');
  } finally {
    await session.close();
  }
});

// Endpoint to list all corpus items by corpus_id
router.get('/list/corpus_items', async (req, res) => {
  const { corpus_id } = req.query; // Get corpus_id from query parameters
  if (!corpus_id) {
    return res.status(400).send('Missing corpus_id parameter');
  }

  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
      RETURN item.arabic AS arabic, item.transliteration AS transliteration, item.item_id AS item_id, item.english AS english, item.sem AS sem, item.qrootfreq AS qrootfreq
      LIMIT 100
    `, { corpus_id });

    const corpusItems = formatSimpleData(result.records);
    console.log('Fetched all corpus items:', corpusItems); // Add logging
    res.json(corpusItems);
  } catch (error) {
    console.error('Error fetching corpus items:', error);
    res.status(500).send('Error fetching corpus items');
  } finally {
    await session.close();
  }
});

// Endpoint to get the aya count for a specific surah
router.get('/list/surah_aya_count', async (req, res) => {
  const { sura_index } = req.query;
  if (!sura_index) {
    return res.status(400).send('Missing sura_index parameter');
  }

  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (item:CorpusItem {sura_index: toInteger($sura_index)})
      WITH DISTINCT item.aya_index AS aya
      RETURN count(aya) AS aya_count
    `, { sura_index });

    const ayaCount = result.records[0].get('aya_count').toInt(); // Get the aya count
    res.json({ aya_count: ayaCount });
  } catch (error) {
    console.error('Error fetching aya count:', error);
    res.status(500).send('Error fetching aya count');
  } finally {
    await session.close();
  }
});

// DEPRECATED: Use /expand/corpusitem/:itemId/word instead
// corpus item graph
router.get('/words_by_corpus_item/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { corpusId, script } = req.query; // Added corpusId here
  const session = req.driver.session();
  
  try {
    // Updated query to match the CorpusItem with both item_id and corpus_id, and remove form
    let query = `
      MATCH (item:CorpusItem {item_id: toInteger($itemId), corpus_id: toInteger($corpusId)})
      OPTIONAL MATCH (item)-[:HAS_WORD]->(word:Word)
      OPTIONAL MATCH (word)<-[:HAS_WORD]-(root:Root)
      OPTIONAL MATCH (word)-[:HAS_FORM]->(form:Form)
      RETURN item, collect(DISTINCT word) as words, collect(DISTINCT root) as roots, collect(DISTINCT form) as forms
    `;

    const result = await session.run(query, { itemId, corpusId });
    const records = result.records[0];
    if (records) {
      const item = records.get('item').properties;
      const words = records.get('words').map(record => convertIntegers(record.properties));
      const roots = records.get('roots').map(record => convertIntegers(record.properties));
      const forms = records.get('forms').map(record => convertIntegers(record.properties));
      res.json({ item, words, roots, forms });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error fetching words and roots by corpus item:', error);
    res.status(500).send('Error fetching words and roots by corpus item');
  } finally {
    await session.close();
  }
});

// Endpoint to list all available corpora
router.get('/list/corpora', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (corpus:Corpus)
      RETURN corpus.corpus_id AS id, corpus.arabic AS arabic, corpus.english AS english, corpus.sem AS sem, corpus.corpusType AS corpusType
    `);

    const corpora = result.records.map(record => ({
      id: convertIntegers(record.get('id')),
      arabic: record.get('arabic'),
      english: record.get('english'),
      sem: record.get('sem'),
      corpusType: record.get('corpusType')
    }));

    res.json(corpora);
  } catch (error) {
    console.error('Error fetching corpora:', error);
    res.status(500).send('Error fetching corpora');
  } finally {
    await session.close();
  }
});

// Fetch words by form and corpus filter
router.get('/form/:formId/corpus/:corpusId', async (req, res) => {
  const { formId, corpusId } = req.params;
  const { L1, L2, limit = 25 } = req.query; // Default limit to 25 if not provided
  const session = req.driver.session();
  try {
    let query = `
      MATCH (corpus:Corpus {corpus_id: toInteger($corpusId)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word:Word)-[:HAS_FORM]->(form:Form {form_id: toInteger($formId)})
      RETURN word
      LIMIT toInteger($limit)
    `;
    const result = await session.run(query, { formId, corpusId, limit });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by form and corpus');
  } finally {
    await session.close();
  }
});

// Fetch words by root and corpus filter
router.get('/root/:rootId/corpus/:corpusId', async (req, res) => {
  const { rootId, corpusId } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (corpus:Corpus {corpus_id: toInteger($corpusId)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word:Word)-[:HAS_ROOT]->(root:Root {root_id: toInteger($rootId)})
      RETURN word
    `;
    const result = await session.run(query, { rootId, corpusId, script });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by root and corpus');
  } finally {
    await session.close();
  }
});

// Get corpus item entry
router.get('/corpusitementry/:corpusId/:itemId', async (req, res) => {
  const { corpusId, itemId } = req.params;
  const session = req.driver.session();
  
  try {
    // Determine if this is a hierarchical ID (contains ':')
    const isHierarchicalId = itemId.includes(':');
    const isCorpus2 = parseInt(corpusId) === 2;
    
    const query = isHierarchicalId && isCorpus2 ? `
      MATCH (item:CorpusItem {corpus_id: toInteger($corpusId), item_id: $itemId})
      RETURN item.entry AS entry
    ` : `
      MATCH (item:CorpusItem {corpus_id: toInteger($corpusId), item_id: toInteger($itemId)})
      RETURN item.entry AS entry
    `;
    
    const result = await session.run(query, { 
      corpusId: parseInt(corpusId), 
      itemId: isHierarchicalId && isCorpus2 ? itemId : parseInt(itemId)
    });

    if (result.records.length > 0) {
      const entry = result.records[0].get('entry');
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Corpus item entry not found' });
    }
  } catch (error) {
    console.error('Error fetching corpus item entry:', error);
    res.status(500).json({ error: 'Error fetching corpus item entry' });
  } finally {
    await session.close();
  }
});

// Node Inspector - Get comprehensive node information for corpus items
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

// Navigate through corpus items (next/previous)
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

module.exports = router;