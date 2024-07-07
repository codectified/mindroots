const express = require('express');
const router = express.Router();

// Helper function to format simple lists of data
const formatSimpleData = (records) => {
  return records.map(record => {
    return {
      arabic: record.get('arabic'),
      english: record.get('english')
    };
  });
};

// Helper function to format complex data structures
const formatComplexData = (records) => {
  if (records.length === 0) return null;
  const root = records[0].get('root').properties;
  const words = records[0].get('words').map(word => word.properties);
  return { root, words };
};

// Endpoint to list all root nodes
router.get('/list/roots', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (root:Root)
      RETURN root.arabic AS arabic, root.english AS english
    `);

    const roots = formatSimpleData(result.records);
    console.log('Fetched all roots:', roots); // Add logging
    res.json(roots);
  } catch (error) {
    console.error('Error fetching roots:', error);
    res.status(500).send('Error fetching roots');
  } finally {
    await session.close();
  }
});

// Endpoint to list words from a specific column
router.get('/list/:column', async (req, res) => {
  const { column } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (type:WordType {english: $column})-[:TYPE_HAS_WORD]->(word:Word)
      RETURN word.${script} AS text
    `, { column, script });

    const words = result.records.map(record => record.get('text'));
    console.log(`Fetched words for column ${column} and script ${script}:`, words); // Add logging
    res.json(words);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  } finally {
    await session.close();
  }
});

// Endpoint to fetch data for a specific root and all its subnodes/related nodes
router.get('/root/:word', async (req, res) => {
  const { word } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (root:Root)-[r]->(word:Word {${script}: $word})
      WITH root
      MATCH (root)-[r2]->(relatedWord:Word)
      WHERE relatedWord.${script} IS NOT NULL
      RETURN root, collect(relatedWord) AS words
    `, { word, script });

    const data = formatComplexData(result.records);
    console.log(`Fetched data for word ${word} with script ${script}:`, data); // Add logging
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  } finally {
    await session.close();
  }
});

// New endpoint to fetch data for a specific root based on its property
router.get('/root-data/:root', async (req, res) => {
  const { root } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (root:Root {${script}: $root})
      WITH root
      MATCH (root)-[r]->(word:Word)
      RETURN root, collect(word) AS words
    `, { root, script });

    const data = formatComplexData(result.records);
    console.log(`Fetched data for root ${root} with script ${script}:`, data); // Add logging
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  } finally {
    await session.close();
  }
});

module.exports = router;
