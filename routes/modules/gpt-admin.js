const express = require('express');
const { convertIntegers } = require('./utils');
const { authenticateAdminAPI, sanitizeReadOnlyQuery } = require('../../middleware/auth');
const router = express.Router();

// READ-ONLY Cypher query execution endpoint (PUBLIC API)
router.post('/execute-query', async (req, res) => {
  const { query } = req.body;  
  
  // Validate query is read-only
  const sanitizationResult = sanitizeReadOnlyQuery(query);
  if (!sanitizationResult.isValid) {
    console.log(`Blocked write operation attempt from IP: ${req.ip}, Query: ${query?.substring(0, 100)}...`);
    return res.status(403).json({ 
      error: sanitizationResult.error,
      hint: 'Use /api/query endpoint with admin credentials for write operations'
    });
  }
  
  const session = req.driver.session();  
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
    res.status(500).json({ error: 'Error executing query' });
  } finally {
    await session.close();
  }
});

// FULL ACCESS Cypher query execution endpoint (ADMIN API ONLY)
router.post('/query', authenticateAdminAPI, async (req, res) => {
  const { query } = req.body;  
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      error: 'Query must be a non-empty string' 
    });
  }
  
  const session = req.driver.session();  
  try {
    console.log(`Executing admin query from IP: ${req.ip}, Query: ${query.substring(0, 100)}...`);
    const result = await session.run(query);
    const records = result.records.map(record => {
      const processedRecord = record.toObject();
      return convertIntegers(processedRecord);  // Ensure integers are converted
    });
    
    // Include additional metadata for admin queries
    const responseData = {
      records,
      summary: {
        totalRecords: records.length,
        queryType: result.summary?.queryType || 'unknown',
        counters: result.summary?.counters || {},
        executionTime: result.summary?.resultAvailableAfter?.toNumber() || 0
      }
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error executing admin query:', error);
    res.status(500).json({ 
      error: 'Error executing query',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// SPECIALIZED ROOT ANALYSIS WRITE ENDPOINT
// Creates structured Analysis nodes linked to Root nodes
router.post('/write-root-analysis', async (req, res) => {
  // Verify this is using public API key (GPT authentication)
  if (req.authLevel !== 'public') {
    return res.status(403).json({ 
      error: 'This endpoint requires public GPT API key authentication' 
    });
  }

  const { rootId, analysis } = req.body;
  
  // Validate analysis object structure
  if (!analysis || typeof analysis !== 'object') {
    return res.status(400).json({ 
      error: 'analysis object is required',
      usage: 'POST /api/write-root-analysis',
      format: '{ "rootId": 123, "analysis": { "concrete_origin": "...", "fundamental_frame": "..." } }',
      requiredFields: ['rootId', 'analysis'],
      v2Fields: ['concrete_origin', 'path_to_abstraction', 'fundamental_frame', 'basic_stats', 'quranic_refs', 'hadith_refs', 'poetic_refs', 'proverbial_refs'],
      v1Fields: ['lexical_summary', 'semantic_path', 'words_expressions', 'poetic_references']
    });
  }
  
  const { 
    // v2 schema fields
    concrete_origin,
    path_to_abstraction,
    fundamental_frame,
    basic_stats,
    quranic_refs,
    hadith_refs,
    poetic_refs,
    proverbial_refs,
    // Legacy v1 fields (backward compatibility)
    lexical_summary, 
    semantic_path, 
    words_expressions, 
    poetic_references, 
    version 
  } = analysis;

  // Validate required parameters - support both v1 and v2 schemas
  const hasV2Fields = concrete_origin || path_to_abstraction || fundamental_frame || basic_stats || 
                      quranic_refs || hadith_refs || poetic_refs || proverbial_refs;
  const hasV1Fields = lexical_summary || semantic_path || words_expressions || poetic_references;
  
  if (!rootId || (!hasV1Fields && !hasV2Fields)) {
    return res.status(400).json({ 
      error: 'rootId and at least one analysis field are required',
      usage: 'POST /api/write-root-analysis',
      format: '{ "rootId": 123, "analysis": { "concrete_origin": "...", "fundamental_frame": "..." } }',
      requiredFields: ['rootId'],
      v2Fields: ['concrete_origin', 'path_to_abstraction', 'fundamental_frame', 'basic_stats', 'quranic_refs', 'hadith_refs', 'poetic_refs', 'proverbial_refs'],
      v1Fields: ['lexical_summary', 'semantic_path', 'words_expressions', 'poetic_references'],
      systemFields: ['version']
    });
  }

  const session = req.driver.session();
  try {
    // First, verify the node is actually a Root node
    const verifyQuery = `
      MATCH (r:Root) 
      WHERE r.root_id = toInteger($rootId) OR r.id = toInteger($rootId) OR r.root_id = $rootId OR r.id = $rootId
      RETURN r.root_id as root_id, r.arabic as arabic, r.id as id
    `;
    
    const verifyResult = await session.run(verifyQuery, { rootId });
    
    if (verifyResult.records.length === 0) {
      console.log(`Root analysis write failed - root not found: ${rootId}, IP: ${req.ip}`);
      return res.status(404).json({ 
        error: 'Root node not found',
        rootId: rootId 
      });
    }

    const rootRecord = verifyResult.records[0];
    const actualRootId = rootRecord.get('root_id') || rootRecord.get('id');
    const arabicRoot = rootRecord.get('arabic');

    // Generate unique analysis ID and get next version number
    const timestamp = new Date().toISOString();
    const analysisId = `analysis_${actualRootId}_${Date.now()}`;
    
    // Check for existing analyses to determine version number
    const versionQuery = `
      MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis)
      WHERE r.root_id = toInteger($rootId) OR r.id = toInteger($rootId) OR r.root_id = $rootId OR r.id = $rootId
      RETURN MAX(a.version) as max_version
    `;
    
    const versionResult = await session.run(versionQuery, { rootId });
    const maxVersion = versionResult.records[0]?.get('max_version') || 0;
    const nextVersion = version || (convertIntegers(maxVersion) + 1);

    // Hard-coded Cypher for security - create Analysis node with structured sections (v2 + v1 support)
    const writeQuery = `
      MATCH (r:Root) 
      WHERE r.root_id = toInteger($rootId) OR r.id = toInteger($rootId) OR r.root_id = $rootId OR r.id = $rootId
      CREATE (a:Analysis {
        id: $analysisId,
        version: $version,
        created: $timestamp,
        source: "gpt-analysis",
        ip: $ip,
        user_edited: false,
        validation_status: "pending",
        
        // v2 schema fields
        concrete_origin: $concrete_origin,
        path_to_abstraction: $path_to_abstraction,
        fundamental_frame: $fundamental_frame,
        basic_stats: $basic_stats,
        quranic_refs: $quranic_refs,
        hadith_refs: $hadith_refs,
        poetic_refs: $poetic_refs,
        proverbial_refs: $proverbial_refs,
        
        // Legacy v1 fields (backward compatibility)
        lexical_summary: $lexical_summary,
        semantic_path: $semantic_path,
        words_expressions: $words_expressions,
        poetic_references: $poetic_references
      })
      CREATE (r)-[:HAS_ANALYSIS]->(a)
      RETURN r.root_id as root_id, r.arabic as arabic, a.id as analysis_id, a.version as version
    `;

    console.log(`Creating Analysis node v${nextVersion} for root ${actualRootId} (${arabicRoot}) from IP: ${req.ip}`);
    const writeResult = await session.run(writeQuery, { 
      rootId,
      analysisId,
      version: nextVersion,
      timestamp,
      ip: req.ip,
      // v2 schema fields
      concrete_origin: concrete_origin?.trim() || null,
      path_to_abstraction: path_to_abstraction?.trim() || null,
      fundamental_frame: fundamental_frame?.trim() || null,
      basic_stats: basic_stats?.trim() || null,
      quranic_refs: quranic_refs?.trim() || null,
      hadith_refs: hadith_refs?.trim() || null,
      poetic_refs: poetic_refs?.trim() || null,
      proverbial_refs: proverbial_refs?.trim() || null,
      // Legacy v1 fields
      lexical_summary: lexical_summary?.trim() || null,
      semantic_path: semantic_path?.trim() || null,
      words_expressions: words_expressions?.trim() || null,
      poetic_references: poetic_references?.trim() || null
    });

    const updatedRecord = writeResult.records[0];
    const createdAnalysisId = updatedRecord.get('analysis_id');
    const createdVersion = updatedRecord.get('version');

    res.json({
      success: true,
      message: 'Analysis node created successfully',
      rootId: convertIntegers(actualRootId),
      arabic: arabicRoot,
      analysisId: createdAnalysisId,
      version: convertIntegers(createdVersion),
      timestamp: timestamp,
      sections: {
        lexical_summary: !!lexical_summary,
        semantic_path: !!semantic_path,
        fundamental_frame: !!fundamental_frame,
        words_expressions: !!words_expressions,
        poetic_references: !!poetic_references,
        basic_stats: !!basic_stats
      }
    });

    console.log(`Successfully created Analysis node ${createdAnalysisId} v${createdVersion} for root ${actualRootId}`);

  } catch (error) {
    console.error('Error creating root analysis:', error);
    res.status(500).json({ 
      error: 'Error creating analysis node',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

module.exports = router;