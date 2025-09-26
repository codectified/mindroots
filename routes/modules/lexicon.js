const express = require('express');
const fs = require('fs');
const path = require('path');
const { convertIntegers } = require('./utils');
const router = express.Router();

// Dictionary and Lexicon Routes

// Get root by word ID
router.get('/rootbyword/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const { L1, L2 } = req.query;
  const session = req.driver.session();
  try {
    const query = `
      MATCH (root:Root)-[:HAS_WORD]->(word:Word {word_id: toInteger($wordId)})
      RETURN root
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

    if (result.records.length > 0) {
      const root = result.records[0].get('root').properties;
      res.json({
        ...root,
        label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
        root_id: root.root_id
      });
    } else {
      res.status(404).json({ error: 'Root not found' });
    }
  } catch (error) {
    console.error('Error fetching root by word:', error);
    res.status(500).json({ error: 'Error fetching root by word' });
  } finally {
    await session.close();
  }
});

// Get forms by word ID
router.get('/formsbyword/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const { L1, L2 } = req.query;
  const session = req.driver.session();
  try {
    const query = `
      MATCH (word:Word {word_id: toInteger($wordId)})-[:HAS_FORM]->(form:Form)
      RETURN form
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

    if (result.records.length > 0) {
      const forms = result.records.map(record => record.get('form').properties);
      res.json(forms.map(form => ({
        ...form,
        label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
        form_id: form.form_id
      })));
    } else {
      res.status(404).json({ error: 'Forms not found' });
    }
  } catch (error) {
    console.error('Error fetching forms by word:', error);
    res.status(500).json({ error: 'Error fetching forms by word' });
  } finally {
    await session.close();
  }
});

// Get Lane's Lexicon entry by word ID
router.get('/laneentry/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (word:Word {word_id: toInteger($wordId)})
      RETURN word.definitions AS definitions
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

    if (result.records.length > 0) {
      const definitions = result.records[0].get('definitions');
      res.json(definitions);
    } else {
      res.status(404).json({ error: 'Lane entry not found' });
    }
  } catch (error) {
    console.error('Error fetching Lane entry by word:', error);
    res.status(500).json({ error: 'Error fetching Lane entry by word' });
  } finally {
    await session.close();
  }
});

// Get Hans Wehr dictionary entry by word ID
router.get('/hanswehrentry/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (word:Word {word_id: toInteger($wordId)})
      RETURN word.hanswehr_entry AS hanswehrEntry
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

    if (result.records.length > 0) {
      const hanswehrEntry = result.records[0].get('hanswehrEntry');
      res.json(hanswehrEntry);
    } else {
      res.status(404).json({ error: 'Hans Wehr entry not found' });
    }
  } catch (error) {
    console.error('Error fetching Hans Wehr entry by word:', error);
    res.status(500).json({ error: 'Error fetching Hans Wehr entry by word' });
  } finally {
    await session.close();
  }
});

// Get corpus item entry by corpus and item ID (supports both integer and hierarchical IDs)
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

// Get root-level dictionary entry by root ID
router.get('/rootentry/:rootId', async (req, res) => {
  const { rootId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (root:Root {root_id: toInteger($rootId)})
      RETURN root.entry AS entry
    `;
    const result = await session.run(query, { rootId: parseInt(rootId) });

    if (result.records.length > 0) {
      const entry = result.records[0].get('entry');
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Root entry not found' });
    }
  } catch (error) {
    console.error('Error fetching root entry:', error);
    res.status(500).json({ error: 'Error fetching root entry' });
  } finally {
    await session.close();
  }
});

// Generic analysis data endpoint for any node type
router.get('/analysis/:nodeType/:nodeId', async (req, res) => {
  const { nodeType, nodeId } = req.params;
  const session = req.driver.session();
  
  try {
    let query;
    let params;

    // Build query based on node type
    switch (nodeType.toLowerCase()) {
      case 'root':
        query = `
          MATCH (n:Root {root_id: toInteger($nodeId)})
          OPTIONAL MATCH (n)-[:HAS_ANALYSIS]->(analysis:Analysis)
          RETURN collect(DISTINCT {
            // Core Fields (v2 schema)
            concrete_origin: analysis.concrete_origin,
            path_to_abstraction: analysis.path_to_abstraction,
            fundamental_frame: analysis.fundamental_frame,
            basic_stats: analysis.basic_stats,
            
            // Reference Fields (v2 schema)
            quranic_refs: analysis.quranic_refs,
            hadith_refs: analysis.hadith_refs,
            poetic_refs: analysis.poetic_refs,
            proverbial_refs: analysis.proverbial_refs,
            
            // Legacy v1 fields (backward compatibility)
            lexical_summary: analysis.lexical_summary,
            semantic_path: analysis.semantic_path,
            words_expressions: analysis.words_expressions,
            poetic_references: analysis.poetic_references,
            
            // System fields
            version: analysis.version,
            created_at: analysis.created_at
          }) AS analyses
        `;
        params = { nodeId: parseInt(nodeId) };
        break;
        
      // Future: Add other node types here
      case 'word':
      case 'form':
      default:
        // For now, return empty analyses for other node types
        res.json({ analyses: [] });
        return;
    }

    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const analyses = result.records[0].get('analyses').filter(a => 
        // Check for v2 schema fields
        a.concrete_origin || a.path_to_abstraction || 
        // Or legacy v1 fields for backward compatibility
        a.lexical_summary || a.semantic_path
      );
      res.json({ analyses: analyses });
    } else {
      res.json({ analyses: [] });
    }
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    res.status(500).json({ error: 'Error fetching analysis data' });
  } finally {
    await session.close();
  }
});

// Root headers for previous analyses (lightweight - no full analysis data)
router.get('/analysis-headers', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis)
      WITH r, a, 
           a.created as timestamp,
           COALESCE(a.version, 1) as version
      ORDER BY r.root_id, timestamp DESC, version DESC
      WITH r, 
           collect(a)[0] as latest_analysis,
           collect(timestamp)[0] as latest_timestamp,
           collect(version)[0] as latest_version
      ORDER BY latest_timestamp DESC
      RETURN {
        root: {
          root_id: r.root_id,
          arabic: r.arabic,
          english: r.english
        },
        analysis_meta: {
          version: latest_version,
          timestamp: latest_timestamp
        }
      } as analysis_header
    `);

    if (result.records.length === 0) {
      return res.json({ 
        headers: [],
        message: "No analyses found" 
      });
    }

    const headers = result.records.map(record => 
      convertIntegers(record.get('analysis_header'))
    );
    
    res.json({ headers });
    
  } catch (error) {
    console.error('Error fetching analysis headers:', error);
    res.status(500).json({ 
      error: 'Error fetching analysis headers',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Single analysis by root ID (for on-demand loading)
router.get('/analysis-by-root/:rootId', async (req, res) => {
  const session = req.driver.session();
  try {
    const { rootId } = req.params;
    
    const result = await session.run(`
      MATCH (r:Root {root_id: toInteger($rootId)})-[:HAS_ANALYSIS]->(a:Analysis)
      WITH r, a, 
           a.created as timestamp,
           COALESCE(a.version, 1) as version
      ORDER BY timestamp DESC, version DESC
      LIMIT 1
      RETURN {
        root: {
          root_id: r.root_id,
          arabic: r.arabic,
          english: r.english,
          definitions: r.definitions,
          hanswehr_entry: r.hanswehr_entry,
          meaning: r.meaning
        },
        analysis: {
          concrete_origin: a.concrete_origin,
          path_to_abstraction: a.path_to_abstraction,
          fundamental_frame: a.fundamental_frame,
          basic_stats: a.basic_stats,
          quranic_refs: a.quranic_refs,
          hadith_refs: a.hadith_refs,
          poetic_refs: a.poetic_refs,
          proverbial_refs: a.proverbial_refs,
          lexical_summary: a.lexical_summary,
          semantic_path: a.semantic_path,
          words_expressions: a.words_expressions,
          poetic_references: a.poetic_references,
          version: version,
          timestamp: timestamp
        }
      } as analysis_data
    `, { rootId: parseInt(rootId) });

    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: 'Analysis not found',
        message: `No analysis found for root ID ${rootId}` 
      });
    }

    const analysisData = convertIntegers(result.records[0].get('analysis_data'));
    res.json({ analysis: analysisData });
    
  } catch (error) {
    console.error('Error fetching analysis by root:', error);
    res.status(500).json({ 
      error: 'Error fetching analysis by root',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Endpoint to list all Markdown files in a directory
router.get('/list-markdown-files', (req, res) => {
  const directoryPath = path.join(__dirname, '../../public/theoption.life'); // Adjust path for modules subdirectory

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Unable to scan directory:', err);
      return res.status(500).send('Unable to scan directory');
    }

    // Filter only .md files and return their names
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    res.json(markdownFiles);
  });
});

module.exports = router;