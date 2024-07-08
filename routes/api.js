const express = require('express');
const router = express.Router();

// Helper function to format the data
const formatData = (records) => {
  return records.map(record => {
    const root = record.get('root').properties;
    const words = record.get('words').map(word => word.properties);
    return { root, words };
  });
};

const formatSimpleData = (records) => {
  return records.map(record => ({
    arabic: record.get('arabic'),
    english: record.get('english')
  }));
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

// Endpoint to list words from a specific concept
router.get('/list/:concept', async (req, res) => {
  const { concept } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (concept:Concept {name: $concept})-[:HAS_WORD]->(word:Word)
      RETURN word.${script} AS text
    `, { concept, script });

    const words = result.records.map(record => record.get('text'));
    console.log(`Fetched words for concept ${concept} and script ${script}:`, words); // Add logging
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

    const data = formatData(result.records);
    console.log(`Fetched data for word ${word} with script ${script}:`, data); // Add logging
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  } finally {
    await session.close();
  }
});

// Endpoint to fetch data for a specific root and its radical family
router.get('/root-data/:root', async (req, res) => {
  const { root } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (radicalFamily:RadicalFamily {${script}: $root})<-[:BELONGS_TO]-(root:Root)
      WITH root
      MATCH (root)-[r]->(relatedWord:Word)
      WHERE relatedWord.${script} IS NOT NULL
      RETURN root, collect(relatedWord) AS words
    `, { root, script });

    const data = formatData(result.records);
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
