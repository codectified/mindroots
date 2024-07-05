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

// Endpoint to list words from a specific column
router.get('/list/:column', async (req, res) => {
  const { column } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const relationshipType = `HAS_${column.toUpperCase()}`;
    const result = await session.run(`
      MATCH (root:Root)-[:${relationshipType}]->(word:Word {script: $script})
      RETURN word.text AS text
    `, { script });

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

// Endpoint to fetch data for a specific root and all its subnodes/related nodes with script as a variable
router.get('/root/:word', async (req, res) => {
  const { word } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (root:Root)-[r]->(word:Word {text: $word, script: $script})
      WITH root
      MATCH (root)-[r2]->(relatedWord:Word {script: $script})
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


// Endpoint to switch scripts
router.get('/switch-script', async (req, res) => {
  const { root, script } = req.query; // Expecting `root` and `script` as query parameters
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (root:Root {root: $root})-[:HAS_WORD|HAS_INFINITIVE|HAS_ACTIVE_PARTICIPLE|HAS_PASSIVE_PARTICIPLE|HAS_NOUN_OF_PLACE|HAS_SINGULAR|HAS_NOUN_OF_STATE|HAS_NOUN_OF_INSTRUMENTATION|HAS_NOUN_OF_ESSENCE|HAS_NOUN_OF_HYPERBOLE]->(word:Word {script: $script})
      RETURN root, collect(word) AS words
    `, { root, script });

    const data = result.records.map(record => ({
      root: record.get('root').properties,
      words: record.get('words').map(word => word.properties)
    }));

    res.json(data);
  } catch (error) {
    console.error('Error switching script:', error);
    res.status(500).send('Error switching script');
  } finally {
    await session.close();
  }
});

module.exports = router;
