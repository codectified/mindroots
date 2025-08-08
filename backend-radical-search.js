/**
 * RadicalPosition-based Root Search Endpoint
 * Add this to your backend server (Express.js + Neo4j)
 * 
 * Endpoint: POST /radical-search
 * 
 * This replaces the old hardcoded r1,r2,r3 approach with the new 
 * RadicalPosition layer for flexible radical-based root searching.
 */

const neo4j = require('neo4j-driver');

// Add this route to your Express server
app.get('/radical-search', async (req, res) => {
  try {
    const { radicals, L1, L2, searchType } = req.query;
    
    // Parse radicals array from JSON string
    let radicalsArray = [];
    try {
      radicalsArray = JSON.parse(radicals || '[]');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid radicals format' });
    }
    
    // Validate input
    if (!Array.isArray(radicalsArray) || radicalsArray.length === 0) {
      return res.status(400).json({ error: 'At least one radical is required' });
    }
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });
    }
    
    // Extract radicals and positions for Cypher query
    const radicalStrings = radicalsArray.map(r => r.radical);
    const positions = radicalsArray.map(r => r.position);
    
    // Build Cypher query based on searchType
    let cypherQuery = '';
    let queryParams = {
      radicals: radicalStrings,
      positions: positions,
      limit: 25 // Default limit
    };
    
    switch (searchType) {
      case 'biradical_only':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size((root)-[:HAS_RADICAL]->(:RadicalPosition)) = 2
          RETURN root
          ORDER BY root.${L1}
          LIMIT $limit
        `;
        break;
        
      case 'exact_match':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size((root)-[:HAS_RADICAL]->(:RadicalPosition)) = size($radicals)
          RETURN root
          ORDER BY root.${L1}
          LIMIT $limit
        `;
        break;
        
      case 'biradical_and_matching_triradical':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals, 
               size((root)-[:HAS_RADICAL]->(:RadicalPosition)) as root_length
          WHERE size(matched_radicals) >= 2 AND (
            (root_length = 2 AND size(matched_radicals) = 2) OR
            (root_length = 3 AND size(matched_radicals) = 3)
          )
          RETURN root
          ORDER BY root_length, root.${L1}
          LIMIT $limit
        `;
        break;
        
      case 'extended_and_longer':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size((root)-[:HAS_RADICAL]->(:RadicalPosition)) >= 4
          RETURN root
          ORDER BY root.${L1}
          LIMIT $limit
        `;
        break;
        
      case 'flexible':
      default:
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals)
          RETURN root
          ORDER BY root.${L1}
          LIMIT $limit
        `;
        break;
    }
    
    // Execute query
    const session = driver.session();
    try {
      const result = await session.run(cypherQuery, queryParams);
      
      // Format results
      const roots = result.records.map(record => {
        const root = record.get('root').properties;
        
        // Convert Neo4j integers to regular numbers
        const convertedRoot = {};
        for (const [key, value] of Object.entries(root)) {
          if (neo4j.isInt(value)) {
            convertedRoot[key] = value.toNumber();
          } else {
            convertedRoot[key] = value;
          }
        }
        
        return convertedRoot;
      });
      
      // Return results with metadata
      res.json({
        roots,
        total: roots.length,
        searchType,
        radicals: radicalsArray,
        message: `Found ${roots.length} roots using RadicalPosition search`
      });
      
    } finally {
      await session.close();
    }
    
  } catch (error) {
    console.error('Error in radical-search endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      searchType: req.query.searchType
    });
  }
});

/**
 * Test Cases to Validate:
 * 
 * 1. Biradical Only (R3 = "NoR3" or blank)
 *    GET /radical-search?radicals=[{"radical":"ك","position":1},{"radical":"ت","position":2}]&searchType=biradical_only&L1=arabic&L2=english
 *    Expected: Only 2-radical roots like كت
 * 
 * 2. R3 = R2 (biradical + matching triradical)
 *    GET /radical-search?radicals=[{"radical":"ك","position":1},{"radical":"ت","position":2},{"radical":"ت","position":3}]&searchType=biradical_and_matching_triradical&L1=arabic&L2=english
 *    Expected: Both كت (biradical) AND كتت (if it exists)
 * 
 * 3. Exact triradical match
 *    GET /radical-search?radicals=[{"radical":"ك","position":1},{"radical":"ت","position":2},{"radical":"ب","position":3}]&searchType=exact_match&L1=arabic&L2=english
 *    Expected: Only كتب (exact match)
 * 
 * 4. Extended roots (4+ radicals)
 *    GET /radical-search?radicals=[{"radical":"ك","position":1},{"radical":"ت","position":2},{"radical":"ب","position":3}]&searchType=extended_and_longer&L1=arabic&L2=english
 *    Expected: Quadriliteral+ roots starting with كتب
 * 
 * 5. Partial matching (R1 only)
 *    GET /radical-search?radicals=[{"radical":"ك","position":1}]&searchType=flexible&L1=arabic&L2=english
 *    Expected: All roots starting with ك
 */

// Backward compatibility aliases for old endpoints
app.get('/rootbyletters', async (req, res) => {
  const { r1, r2, r3, L1, L2, searchType } = req.query;
  
  // Convert to new format
  const radicals = [];
  if (r1) radicals.push({ radical: r1, position: 1 });
  if (r2) radicals.push({ radical: r2, position: 2 });
  if (r3 && r3 !== 'NoR3') radicals.push({ radical: r3, position: 3 });
  
  // Determine search behavior
  let newSearchType = 'flexible';
  if (r3 === 'NoR3') {
    newSearchType = 'biradical_only';
  } else if (r3 === r2) {
    newSearchType = 'biradical_and_matching_triradical';
  } else if (r3) {
    newSearchType = 'exact_match';
  }
  
  // Forward to new endpoint
  req.query.radicals = JSON.stringify(radicals);
  req.query.searchType = newSearchType;
  
  // Call the new radical-search handler
  // (You can redirect or reuse the same handler logic)
  return res.redirect(307, `/radical-search?radicals=${encodeURIComponent(JSON.stringify(radicals))}&searchType=${newSearchType}&L1=${L1}&L2=${L2 || 'off'}`);
});

app.get('/geminate-roots', async (req, res) => {
  const { r1, r2, L1, L2 } = req.query;
  const radicals = [];
  if (r1) radicals.push({ radical: r1, position: 1 });
  if (r2) radicals.push({ radical: r2, position: 2 });
  
  req.query.radicals = JSON.stringify(radicals);
  req.query.searchType = 'biradical_only';
  
  return res.redirect(307, `/radical-search?radicals=${encodeURIComponent(JSON.stringify(radicals))}&searchType=biradical_only&L1=${L1}&L2=${L2 || 'off'}`);
});

app.get('/triliteral-roots', async (req, res) => {
  const { r1, r2, r3, L1, L2 } = req.query;
  const radicals = [];
  if (r1) radicals.push({ radical: r1, position: 1 });
  if (r2) radicals.push({ radical: r2, position: 2 });
  if (r3) radicals.push({ radical: r3, position: 3 });
  
  req.query.radicals = JSON.stringify(radicals);
  req.query.searchType = 'exact_match';
  
  return res.redirect(307, `/radical-search?radicals=${encodeURIComponent(JSON.stringify(radicals))}&searchType=exact_match&L1=${L1}&L2=${L2 || 'off'}`);
});

app.get('/extended-roots', async (req, res) => {
  const { r1, r2, r3, L1, L2 } = req.query;
  const radicals = [];
  if (r1) radicals.push({ radical: r1, position: 1 });
  if (r2) radicals.push({ radical: r2, position: 2 });
  if (r3) radicals.push({ radical: r3, position: 3 });
  
  req.query.radicals = JSON.stringify(radicals);
  req.query.searchType = 'extended_and_longer';
  
  return res.redirect(307, `/radical-search?radicals=${encodeURIComponent(JSON.stringify(radicals))}&searchType=extended_and_longer&L1=${L1}&L2=${L2 || 'off'}`);
});

module.exports = {
  // Export any helper functions if needed
  convertRadicalsToPositions: (r1, r2, r3) => {
    const radicals = [];
    if (r1) radicals.push({ radical: r1, position: 1 });
    if (r2) radicals.push({ radical: r2, position: 2 });
    if (r3 && r3 !== 'NoR3') radicals.push({ radical: r3, position: 3 });
    return radicals;
  }
};