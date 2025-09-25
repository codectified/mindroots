const express = require('express');
const { convertIntegers } = require('./utils');
const { authenticateAPI } = require('../../middleware/auth');
const router = express.Router();

// Main graph expansion endpoint - handles various source/target type combinations
router.get('/expand/:sourceType/:sourceId/:targetType', async (req, res) => {
  const { sourceType, targetType } = req.params;
  const { L1, L2 } = req.query;
  
  // Handle different ID formats: hierarchical strings (Corpus 2) vs integers (Corpus 1,3)
  let sourceId = req.params.sourceId;
  const corpus_id = req.query.corpus_id ? parseInt(req.query.corpus_id, 10) : null;
  
  // Only convert to integer for non-corpus items or non-hierarchical corpus items
  if (sourceType !== 'corpusitem' || (sourceType === 'corpusitem' && !sourceId.includes(':'))) {
    sourceId = parseInt(sourceId, 10);
  }
  const limit = parseInt(req.query.limit || 25, 10);
  
  console.log(`Expand route called: ${sourceType}/${sourceId}/${targetType}`, { L1, L2, corpus_id, limit, sourceIdType: typeof sourceId, corpusIdType: typeof corpus_id, limitType: typeof limit });
  
  const session = req.driver.session();
  
  try {
    let query = '';
    let params = { sourceId, limit };
    
    // Add corpus_id to params if provided
    if (corpus_id) {
      params.corpus_id = corpus_id;
    }
    
    // Build query based on source and target types
    if (sourceType === 'root' && targetType === 'word') {
      if (corpus_id) {
        query = `
          MATCH (root:Root {root_id: toInteger($sourceId)})-[:HAS_WORD]->(word:Word)
          MATCH (corpus:Corpus {corpus_id: toInteger($corpus_id)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word)
          OPTIONAL MATCH (word)-[:ETYM]->(etym:Word)
          RETURN DISTINCT root, word, etym
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (root:Root {root_id: toInteger($sourceId)})-[:HAS_WORD]->(word:Word)
          OPTIONAL MATCH (word)-[:ETYM]->(etym:Word)
          RETURN DISTINCT root, word, etym
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'form' && targetType === 'word') {
      if (corpus_id) {
        query = `
          MATCH (form:Form {form_id: toInteger($sourceId)})<-[:HAS_FORM]-(word:Word)
          MATCH (corpus:Corpus {corpus_id: toInteger($corpus_id)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word)
          RETURN DISTINCT form, word
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (form:Form {form_id: toInteger($sourceId)})<-[:HAS_FORM]-(word:Word)
          RETURN DISTINCT form, word
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'corpusitem' && targetType === 'word') {
      // CONSOLIDATED: This replaces the legacy /words_by_corpus_item/:itemId route
      // Returns corpus item + connected words, forms, and roots with proper relationships
      if (!corpus_id) {
        return res.status(400).json({ error: 'corpus_id is required for corpusitem expansion' });
      }
      // Handle different corpus ID formats
      const corpusItemQuery = typeof sourceId === 'string' 
        ? `MATCH (item:CorpusItem {item_id: $sourceId, corpus_id: toInteger($corpus_id)})`  // Hierarchical IDs
        : `MATCH (item:CorpusItem {item_id: toInteger($sourceId), corpus_id: toInteger($corpus_id)})`; // Integer IDs
        
      query = `
        ${corpusItemQuery}
        OPTIONAL MATCH (item)-[:HAS_WORD]->(word:Word)
        OPTIONAL MATCH (word)-[:HAS_FORM]->(form:Form)
        OPTIONAL MATCH (word)<-[:HAS_WORD]-(root:Root)
        RETURN DISTINCT item, word, root, form
      `;
    } else if (sourceType === 'word' && targetType === 'corpusitem') {
      // NEW: Word -> CorpusItem expansion
      // Find all corpus items that contain this word
      if (corpus_id) {
        query = `
          MATCH (word:Word {word_id: toInteger($sourceId)})
          MATCH (word)<-[:HAS_WORD]-(item:CorpusItem)-[:BELONGS_TO]->(corpus:Corpus {corpus_id: toInteger($corpus_id)})
          RETURN DISTINCT word, item
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (word:Word {word_id: toInteger($sourceId)})
          MATCH (word)<-[:HAS_WORD]-(item:CorpusItem)
          RETURN DISTINCT word, item
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'word' && targetType === 'root') {
      // NEW: Word -> Root expansion
      // Find the root this word belongs to
      query = `
        MATCH (word:Word {word_id: toInteger($sourceId)})
        MATCH (word)<-[:HAS_WORD]-(root:Root)
        RETURN DISTINCT word, root
        LIMIT toInteger($limit)
      `;
    } else if (sourceType === 'word' && targetType === 'form') {
      // NEW: Word -> Form expansion  
      // Find forms this word is connected to
      query = `
        MATCH (word:Word {word_id: toInteger($sourceId)})
        MATCH (word)-[:HAS_FORM]->(form:Form)
        RETURN DISTINCT word, form
        LIMIT toInteger($limit)
      `;
    } else {
      console.error('Invalid source/target combination:', sourceType, targetType);
      return res.status(400).json({ 
        error: `Invalid source/target type combination: ${sourceType} -> ${targetType}`,
        supportedCombinations: ['root->word', 'form->word', 'corpusitem->word', 'word->corpusitem', 'word->root', 'word->form']
      });
    }
    
    console.log('=== EXPAND REQUEST DEBUG ===');
    console.log('Source:', sourceType, sourceId);
    console.log('Target:', targetType);
    console.log('Corpus filter:', corpus_id || 'none');
    console.log('Query params:', params);
    console.log('Generated Cypher Query:');
    console.log(query);
    console.log('=== END DEBUG ===');
    
    const result = await session.run(query, params);
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    const linkIds = new Set(); // Separate set for link deduplication
    
    // Helper function for canonical ID generation: ${type}_${Number(idProp)}
    const getCanonicalId = (type, idValue) => {
      const numericId = idValue?.low !== undefined ? idValue.low : idValue;
      // Handle hierarchical IDs (keep as string) vs integer IDs (convert to number)
      const finalId = typeof numericId === 'string' && numericId.includes(':') 
        ? numericId  // Keep hierarchical IDs as strings
        : Number(numericId);  // Convert integer IDs to numbers
      return `${type}_${finalId}`;
    };
    
    console.log(`Query returned ${result.records.length} records`);
    
    // If no records found, we need to distinguish between:
    // 1. Source node doesn't exist (404)
    // 2. Source node exists but no targets in corpus (200 with empty data)
    if (result.records.length === 0) {
      // Check if the source node exists at all
      let sourceExistsQuery = '';
      if (sourceType === 'root') {
        sourceExistsQuery = `MATCH (n:Root {root_id: toInteger($sourceId)}) RETURN n LIMIT 1`;
      } else if (sourceType === 'form') {
        sourceExistsQuery = `MATCH (n:Form {form_id: toInteger($sourceId)}) RETURN n LIMIT 1`;
      }
      
      if (sourceExistsQuery) {
        const sourceCheck = await session.run(sourceExistsQuery, { sourceId });
        if (sourceCheck.records.length === 0) {
          // Source node doesn't exist - return 404
          return res.status(404).json({ 
            error: `No ${sourceType} node found with ID ${sourceId}`,
            sourceType,
            sourceId,
            targetType
          });
        } else {
          // Source exists but no targets found (possibly due to corpus filter) - return empty result
          console.log(`${sourceType} ${sourceId} exists but no ${targetType} nodes found${corpus_id ? ` in corpus ${corpus_id}` : ''}`);
          return res.json({ 
            nodes: [], 
            links: [],
            info: {
              message: `${sourceType} exists but no ${targetType} nodes found${corpus_id ? ` in corpus ${corpus_id}` : ''}`,
              sourceExists: true,
              corpusFiltered: !!corpus_id
            }
          });
        }
      }
    }
    
    if (sourceType === 'corpusitem' && targetType === 'word') {
      // Handle corpus item expansion using individual records (FIXED: no more cartesian product)
      result.records.forEach(record => {
        const item = record.get('item')?.properties;
        const word = record.get('word')?.properties;
        const root = record.get('root')?.properties;
        const form = record.get('form')?.properties;
        
        // Add the corpus item node
        if (item) {
          const itemId = getCanonicalId('corpusitem', item.item_id);
          if (!nodeMap.has(itemId)) {
            const itemNode = {
              id: itemId,
              label: L2 === 'off' ? item[L1] : `${item[L1]} / ${item[L2]}`,
              ...convertIntegers(item),
              type: 'corpusitem'
            };
            nodes.push(itemNode);
            nodeMap.set(itemId, itemNode);
          }
        }
        
        // Add word node and corpus item -> word link
        if (word) {
          const wordId = getCanonicalId('word', word.word_id);
          if (!nodeMap.has(wordId)) {
            const wordNode = {
              id: wordId,
              label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`,
              ...convertIntegers(word),
              type: 'word'
            };
            nodes.push(wordNode);
            nodeMap.set(wordId, wordNode);
          }
          
          // Add link from corpus item to word (only if both exist in this record)
          if (item) {
            const linkId = `${getCanonicalId('corpusitem', item.item_id)}-${getCanonicalId('word', word.word_id)}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: getCanonicalId('corpusitem', item.item_id),
                target: wordId,
                type: 'HAS_WORD'
              });
              linkIds.add(linkId); // Track link to prevent duplicates
            }
          }
        }
        
        // Add root node and root -> word link (only for the specific word in this record)
        if (root && word) {
          const rootId = getCanonicalId('root', root.root_id);
          if (!nodeMap.has(rootId)) {
            const rootNode = {
              id: rootId,
              label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
              ...convertIntegers(root),
              type: 'root'
            };
            nodes.push(rootNode);
            nodeMap.set(rootId, rootNode);
          }
          
          // Add link from root to word (only for this specific word)
          const linkId = `${getCanonicalId('root', root.root_id)}-${getCanonicalId('word', word.word_id)}`;
          if (!linkIds.has(linkId)) {
            links.push({
              source: rootId,
              target: getCanonicalId('word', word.word_id),
              type: 'HAS_WORD'
            });
            linkIds.add(linkId); // Track link to prevent duplicates
          }
        }
        
        // Add form node and word -> form link (only for the specific word in this record)
        if (form && word) {
          const formId = getCanonicalId('form', form.form_id);
          if (!nodeMap.has(formId)) {
            const formNode = {
              id: formId,
              label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
              ...convertIntegers(form),
              type: 'form'
            };
            nodes.push(formNode);
            nodeMap.set(formId, formNode);
          }
          
          // Add link from word to form (only for this specific word)
          const linkId = `${getCanonicalId('word', word.word_id)}-${getCanonicalId('form', form.form_id)}`;
          if (!linkIds.has(linkId)) {
            links.push({
              source: getCanonicalId('word', word.word_id),
              target: formId,
              type: 'HAS_FORM'
            });
            linkIds.add(linkId); // Track link to prevent duplicates
          }
        }
      });
      
    } else if (sourceType === 'word' && targetType === 'corpusitem') {
      // Handle word to corpus item expansion
      result.records.forEach(record => {
        const sourceNode = record.get('word')?.properties;
        const targetNode = record.get('item')?.properties;
        
        // Add source word node if not already present
        if (sourceNode && !nodeMap.has(`word_${sourceNode.word_id}`)) {
          const wordNode = {
            id: `word_${sourceNode.word_id}`,
            label: L2 === 'off' ? sourceNode[L1] : `${sourceNode[L1]} / ${sourceNode[L2]}`,
            ...convertIntegers(sourceNode),
            type: 'word'
          };
          nodes.push(wordNode);
          nodeMap.set(wordNode.id, wordNode);
        }
        
        // Add target corpus item node
        if (targetNode && !nodeMap.has(`corpusitem_${targetNode.item_id}`)) {
          const corpusItemNode = {
            id: `corpusitem_${targetNode.item_id}`,
            label: L2 === 'off' ? targetNode[L1] : `${targetNode[L1]} / ${targetNode[L2]}`,
            ...convertIntegers(targetNode),
            type: 'corpusitem' // corpus items
          };
          nodes.push(corpusItemNode);
          nodeMap.set(corpusItemNode.id, corpusItemNode);
          
          // Create link from word to corpus item
          const linkId = `word_${sourceNode.word_id}-corpusitem_${targetNode.item_id}`;
          if (!linkIds.has(linkId)) {
            links.push({
              source: `word_${sourceNode.word_id}`,
              target: `corpusitem_${targetNode.item_id}`,
              type: 'USED_IN'
            });
            linkIds.add(linkId);
          }
        }
      });
      
    } else if (sourceType === 'word' && (targetType === 'root' || targetType === 'form')) {
      // Handle word to root/form expansion
      result.records.forEach(record => {
        const sourceNode = record.get('word')?.properties;
        const targetNode = record.get(targetType)?.properties;
        
        // Add source word node if not already present
        if (sourceNode && !nodeMap.has(`word_${sourceNode.word_id}`)) {
          const wordNode = {
            id: `word_${sourceNode.word_id}`,
            label: L2 === 'off' ? sourceNode[L1] : `${sourceNode[L1]} / ${sourceNode[L2]}`,
            ...convertIntegers(sourceNode),
            type: 'word'
          };
          nodes.push(wordNode);
          nodeMap.set(wordNode.id, wordNode);
        }
        
        // Add target node (root or form)
        if (targetNode && !nodeMap.has(`${targetType}_${targetNode[`${targetType}_id`]}`)) {
          const node = {
            id: `${targetType}_${targetNode[`${targetType}_id`]}`,
            label: L2 === 'off' ? targetNode[L1] : `${targetNode[L1]} / ${targetNode[L2]}`,
            ...convertIntegers(targetNode),
            type: targetType
          };
          nodes.push(node);
          nodeMap.set(node.id, node);
          
          // Create appropriate link
          if (targetType === 'root') {
            const linkId = `root_${targetNode.root_id}-word_${sourceNode.word_id}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: `${targetType}_${targetNode[`${targetType}_id`]}`,
                target: `word_${sourceNode.word_id}`,
                type: 'HAS_WORD'
              });
              linkIds.add(linkId);
            }
          } else if (targetType === 'form') {
            const linkId = `word_${sourceNode.word_id}-form_${targetNode.form_id}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: `word_${sourceNode.word_id}`,
                target: `${targetType}_${targetNode[`${targetType}_id`]}`,
                type: 'HAS_FORM'
              });
              linkIds.add(linkId);
            }
          }
        }
      });
      
    } else {
      // Handle root/form to word expansion
      result.records.forEach(record => {
        const sourceNode = record.get(sourceType)?.properties;
        const targetNode = record.get(targetType)?.properties;
        
        if (sourceNode && !nodeMap.has(`${sourceType}_${sourceNode[`${sourceType}_id`]}`)) {
          const node = {
            id: `${sourceType}_${sourceNode[`${sourceType}_id`]}`,
            label: L2 === 'off' ? sourceNode[L1] : `${sourceNode[L1]} / ${sourceNode[L2]}`,
            ...convertIntegers(sourceNode),
            type: sourceType
          };
          nodes.push(node);
          nodeMap.set(node.id, node);
        }
        
        if (targetNode && !nodeMap.has(`${targetType}_${targetNode[`${targetType}_id`]}`)) {
          const node = {
            id: `${targetType}_${targetNode[`${targetType}_id`]}`,
            label: L2 === 'off' ? targetNode[L1] : `${targetNode[L1]} / ${targetNode[L2]}`,
            ...convertIntegers(targetNode),
            type: targetType
          };
          nodes.push(node);
          nodeMap.set(node.id, node);
          
          // Create appropriate link based on relationship type
          if (sourceType === 'root' && targetType === 'word') {
            const linkId = `root_${sourceNode.root_id}-word_${targetNode.word_id}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: `${sourceType}_${sourceNode[`${sourceType}_id`]}`,
                target: `${targetType}_${targetNode[`${targetType}_id`]}`,
                type: 'HAS_WORD'
              });
              linkIds.add(linkId);
            }
          } else if (sourceType === 'form' && targetType === 'word') {
            const linkId = `word_${targetNode.word_id}-form_${sourceNode.form_id}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: `${targetType}_${targetNode[`${targetType}_id`]}`,
                target: `${sourceType}_${sourceNode[`${sourceType}_id`]}`,
                type: 'HAS_FORM'
              });
              linkIds.add(linkId);
            }
          }
        }
        
        // Handle ETYM relationships for root expansions
        if (sourceType === 'root' && targetType === 'word') {
          const etymNode = record.get('etym')?.properties;
          if (etymNode && targetNode) {
            const etymNodeId = `word_${etymNode.word_id}`;
            const sourceWordId = `word_${targetNode.word_id}`;
            
            // Add etym node if not already present
            if (!nodeMap.has(etymNodeId)) {
              const node = {
                id: etymNodeId,
                label: L2 === 'off' ? etymNode[L1] : `${etymNode[L1]} / ${etymNode[L2]}`,
                ...convertIntegers(etymNode),
                type: 'word'
              };
              nodes.push(node);
              nodeMap.set(etymNodeId, node);
            }
            
            // Add ETYM link
            const linkId = `${sourceWordId}-${etymNodeId}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: sourceWordId,
                target: etymNodeId,
                type: 'ETYM'
              });
              linkIds.add(linkId);
            }
          }
        }
      });
    }
    
    console.log(`Returning ${nodes.length} nodes and ${links.length} links`);
    res.json({ nodes, links });
  } catch (error) {
    console.error('Error in expand route:', error);
    res.status(500).json({ error: 'Error expanding graph', details: error.message });
  } finally {
    await session.close();
  }
});

// Get form details with optional corpus and root filtering
router.get('/form/:formId', async (req, res) => {
  const { formId } = req.params;
  const { script, corpusId, rootIds } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (form:Form {form_id: toInteger($formId)})<-[:HAS_FORM]-(word:Word)
    `;

    if (corpusId) {
      query += `
        WHERE word.corpus_id = toInteger($corpusId)
      `;
    }

    if (rootIds) {
      const rootIdArray = rootIds.split(',').map(id => `toInteger(${id})`);
      query += `
        AND word.root_id IN [${rootIdArray.join(',')}]
      `;
    }

    query += `
      RETURN word
    `;

    const result = await session.run(query, { formId, script, corpusId });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));

    const formattedWords = words.map(word => {
      return {
        ...word,
        label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
      };
    });

    res.json(formattedWords);
  } catch (error) {
    console.error('Error fetching words by form:', error);
    res.status(500).send('Error fetching words by form');
  } finally {
    await session.close();
  }
});

// DEPRECATED: Get words by root radicals (not working currently)
router.get('/words_by_root_radicals', async (req, res) => {
  const { r1, r2, r3, script } = req.query;
  const session = req.driver.session();
  try {
    console.log(`Received request with r1: ${r1}, r2: ${r2}, r3: ${r3}, script: ${script}`);

    let query = `
      MATCH (root:Root)
      WHERE root.r1 = $r1
    `;
    if (r2) query += ` AND root.r2 = $r2`;
    if (r3) query += ` AND root.r3 = $r3`;
    query += `
      MATCH (root)-[:HAS_WORD]->(word:Word)
      RETURN root, collect(DISTINCT word) as words
    `;

    console.log(`Generated query: ${query}`);

    const params = { r1 };
    if (r2) params.r2 = r2;
    if (r3) params.r3 = r3;

    console.log(`Query parameters: ${JSON.stringify(params)}`);

    const result = await session.run(query, params);
    console.log(`Query result: ${JSON.stringify(result.records)}`);

    const records = result.records[0];
    if (records) {
      const root = records.get('root').properties;
      const words = records.get('words').map(record => convertIntegers(record.properties));
      res.json({ root, words });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error fetching words by root radicals:', error);
    res.status(500).send('Error fetching words by root radicals');
  } finally {
    await session.close();
  }
});

// DEPRECATED: Get roots by radicals (not working currently)
router.get('/roots_by_radicals', async (req, res) => {
  const { r1, r2, r3, script } = req.query;
  const session = req.driver.session();
  try {
    console.log(`Received request for roots with radicals r1: ${r1}, r2: ${r2}, r3: ${r3}, script: ${script}`);

    let query = `
      MATCH (root:Root)
      WHERE (root.r1 = $r1 OR $r1 = '*')
        AND (root.r2 = $r2 OR $r2 = '*')
        AND (root.r3 = $r3 OR $r3 = '*')
      RETURN root
    `;

    const result = await session.run(query, { r1, r2, r3 });
    console.log(`Raw records for roots with radicals r1: ${r1}, r2: ${r2}, r3: ${r3}:`, result.records);

    const roots = result.records.map(record => convertIntegers(record.get('root').properties));

    const formattedRoots = roots.map(root => {
      return {
        ...root,
        id: `root_${Number(root.root_id?.low !== undefined ? root.root_id.low : root.root_id)}`,
        type: 'root',
        label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script]
      };
    });

    res.json(formattedRoots);
  } catch (error) {
    console.error('Error fetching roots by radicals:', error);
    res.status(500).send('Error fetching roots by radicals');
  } finally {
    await session.close();
  }
});

// Get roots by form ID
router.get('/form/:formId/roots', async (req, res) => {
  const { formId } = req.params;
  const { L1, L2, rootIds } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (form:Form {form_id: toInteger($formId)})<-[:HAS_FORM]-(word:Word)-[:HAS_ROOT]->(root:Root)
      WHERE root.root_id IN $rootIds
      RETURN word
    `;
    const result = await session.run(query, { formId, rootIds: rootIds.map(id => parseInt(id, 10)) });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by form and roots');
  } finally {
    await session.close();
  }
});

// Get root details with words
router.get('/root/:rootId', async (req, res) => {
  const { rootId } = req.params;
  const { script, corpusId } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (root:Root {root_id: toInteger($rootId)})-[:HAS_WORD]->(word:Word)
    `;

    if (corpusId) {
      query += `
        WHERE word.corpus_id = toInteger($corpusId)
      `;
    }

    query += `
      RETURN word
    `;

    const result = await session.run(query, { rootId, script, corpusId });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));

    const formattedWords = words.map(word => {
      return {
        ...word,
        label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
      };
    });

    res.json(formattedWords);
  } catch (error) {
    console.error('Error fetching words by root:', error);
    res.status(500).send('Error fetching words by root');
  } finally {
    await session.close();
  }
});

// DEPRECATED: Get root with lexicon context (no filter)
router.get('/root/:rootId/lexicon', async (req, res) => {
  const { rootId } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (root:Root {root_id: toInteger($rootId)})-[:HAS_WORD]->(word:Word)
      RETURN word
    `;
    const result = await session.run(query, { rootId, script });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by root');
  } finally {
    await session.close();
  }
});

module.exports = router;