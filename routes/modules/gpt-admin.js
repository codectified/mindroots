const express = require('express');
const neo4j = require('neo4j-driver');
const { convertIntegers } = require('./utils');
const { authenticateAdminAPI, sanitizeReadOnlyQuery } = require('../../middleware/auth');
const router = express.Router();

// READ-ONLY Cypher query execution endpoint (ADMIN API ONLY: the public key ships in the website bundle)
router.post('/execute-query', authenticateAdminAPI, async (req, res) => {
  const { query } = req.body;  
  
  // Validate query is read-only
  const sanitizationResult = sanitizeReadOnlyQuery(query);
  if (!sanitizationResult.isValid) {
    console.log(`Blocked write operation attempt from IP: ${req.ip}, Query: ${query?.substring(0, 100)}...`);
    return res.status(403).json({ 
      error: sanitizationResult.error
    });
  }
  
  // READ mode: the database itself rejects writes, whatever gets past the text check
  const session = req.driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    console.log(`Executing read-only query from IP: ${req.ip}`);
    const result = await session.run(query);
    const records = result.records.map(record => {
      const processedRecord = record.toObject();
      return convertIntegers(processedRecord);  // Ensure integers are converted
    });
    
    res.json(records);
  } catch (error) {
    console.error('Error executing read-only query:', error);
    res.status(500).json({ error: 'Error executing query', details: error.message }); // admin-only route: the details help debugging
  } finally {
    await session.close();
  }
});

// Removed 2026-11-14: POST /query (arbitrary write Cypher) and
// POST /write-root-analysis. They existed for the OpenAI custom GPTs, which are
// no longer used. /execute-query stays: the backup and data-quality scripts use it.

module.exports = router;