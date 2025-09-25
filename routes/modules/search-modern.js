const express = require('express');
const { convertIntegers } = require('./utils');
const router = express.Router();

// ====================================================================
// MODERN RADICALPOSITION-BASED SEARCH SYSTEM
// ====================================================================
// These routes represent the modern, production-active RadicalPosition
// system that uses flexible RadicalPosition nodes in Neo4j for optimal
// performance and extensibility, as opposed to the legacy hardcoded
// r1/r2/r3 property system.
//
// Routes included:
// - /radical-search: Advanced JSON-based query engine
// - /search-roots: Position-specific search with wildcards  
// - /search-combinate: Permutation-based search
// - /search-extended: Extended roots only (4+ radicals)
// ====================================================================

// ====================================================================
// ADVANCED JSON-BASED QUERY ENGINE
// Route: GET /radical-search
// Purpose: Advanced RadicalPosition query with JSON input structure
// Features: Multiple search types, flexible radical/position matching
// ====================================================================
router.get('/radical-search', async (req, res) => {
  try {
    const { radicals, L1, L2, searchType } = req.query;
    
    // Parse radicals array from JSON string
    let radicalsArray = [];
    try {
      radicalsArray = JSON.parse(radicals || '[]');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid radicals format. Expected JSON array.' });
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
      positions: positions
    };
    
    switch (searchType) {
      case 'biradical_only':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = 2
          RETURN root
          ORDER BY root.${L1}
          LIMIT 25
        `;
        break;
        
      case 'exact_match':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = size($radicals)
          RETURN root
          ORDER BY root.${L1}
          LIMIT 25
        `;
        break;
        
      case 'biradical_and_matching_triradical':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals, 
               size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) as root_length
          WHERE size(matched_radicals) >= 2 AND (
            (root_length = 2 AND size(matched_radicals) = 2) OR
            (root_length = 3 AND size(matched_radicals) = 3)
          )
          RETURN root
          ORDER BY root_length, root.${L1}
          LIMIT 25
        `;
        break;
        
      case 'extended_and_longer':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) >= 4
          RETURN root
          ORDER BY root.${L1}
          LIMIT 25
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
          LIMIT 25
        `;
        break;
    }
    
    console.log('=== RADICAL SEARCH DEBUG ===');
    console.log('SearchType:', searchType);
    console.log('Radicals:', radicalsArray);
    console.log('Generated Cypher Query:');
    console.log(cypherQuery);
    console.log('Query params:', queryParams);
    console.log('=== END DEBUG ===');
    
    // Execute query
    const session = req.driver.session();
    try {
      const result = await session.run(cypherQuery, queryParams);
      
      // Format results
      const roots = result.records.map(record => {
        const root = record.get('root').properties;
        
        // Convert Neo4j integers to regular numbers
        const convertedRoot = convertIntegers(root);
        
        // Add label formatting
        return {
          ...convertedRoot,
          label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
        };
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

// ====================================================================
// POSITION-SPECIFIC SEARCH WITH WILDCARDS
// Route: GET /search-roots
// Purpose: Position-specific RadicalPosition search (r1, r2, r3)
// Features: Wildcard support (*), biradical "None" handling, geminate conversion
// ====================================================================
router.get('/search-roots', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2, limit = 25 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });
    }

    const session = req.driver.session();
    let cypherQuery = '';
    let queryParams = {};

    // Create mutable copy of r3 for potential modification
    let actualR3 = r3;
    
    // Handle "None" case for R3 (biradical/geminate search)
    if (r3 === 'None') {
      // If r2 is specified, treat as geminate search (r3 = r2)
      // This saves the user from manually setting r3 to the same value as r2
      if (r2 && r2 !== '*') {
        // Convert None + specified r2 to geminate search
        actualR3 = r2; // Set r3 to same value as r2
        // Fall through to standard search logic below
      } else {
        // Return all biradical roots (wildcard search when r2 is also wildcard)
        cypherQuery = `
          MATCH (root:Root)
          WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = 2
        `;
        
        // Add r1 filter if specified
        if (r1 && r1 !== '*') {
          cypherQuery += `
            AND EXISTS { MATCH (root)-[:HAS_RADICAL]->(rp1:RadicalPosition) WHERE rp1.radical = $r1 AND rp1.position = 1 }
          `;
          queryParams.r1 = r1;
        }
        
        cypherQuery += `
          RETURN root
          ORDER BY root.${L1}
          LIMIT ${parseInt(limit)}
        `;
      }
    }
    
    // Standard position-specific search (handles both regular and converted geminate searches)
    if (actualR3 !== 'None') {
      // Standard position-specific search (2-3 radicals)
      const conditions = [];
      if (r1 && r1 !== '*') {
        conditions.push('(rp.radical = $r1 AND rp.position = 1)');
        queryParams.r1 = r1;
      }
      if (r2 && r2 !== '*') {
        conditions.push('(rp.radical = $r2 AND rp.position = 2)');
        queryParams.r2 = r2;
      }
      if (actualR3 && actualR3 !== '*') {
        conditions.push('(rp.radical = $r3 AND rp.position = 3)');
        queryParams.r3 = actualR3;
      }
      
      // If no radicals specified (all wildcards), return all roots
      if (conditions.length === 0) {
        cypherQuery = `
          MATCH (root:Root)
          WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) <= 3
          RETURN root
          ORDER BY root.${L1}
          LIMIT ${parseInt(limit)}
        `;
      } else {
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE (${conditions.join(' OR ')})
          WITH root, collect(rp) as matched_radicals
          WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) <= 3
            AND size(matched_radicals) = ${conditions.length}
          RETURN root
          ORDER BY root.${L1}
          LIMIT ${parseInt(limit)}
        `;
      }
    }

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
        type: 'root',
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'position-specific',
      message: `Found ${roots.length} roots with position-specific search`
    });

  } catch (error) {
    console.error('Error in search-roots endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ====================================================================
// PERMUTATION-BASED SEARCH
// Route: GET /search-combinate
// Purpose: Find all roots containing specified radicals in any positions
// Features: "None" handling for biradical-only searches, permutation logic
// ====================================================================
router.get('/search-combinate', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2, limit = 25 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });
    }

    // Collect non-wildcard radicals
    const inputRadicals = [r1, r2, r3].filter(r => r && r !== '*');
    
    if (inputRadicals.length === 0) {
      return res.status(400).json({ error: 'At least one radical is required for combinate search' });
    }

    const session = req.driver.session();
    let cypherQuery = '';
    let queryParams = { radicals: inputRadicals };

    // Handle "None" case - only biradical permutations
    if (r3 === 'None') {
      cypherQuery = `
        MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
        WHERE rp.radical IN $radicals
        WITH root, collect(rp.radical) as root_radicals
        WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = 2
          AND all(radical in $radicals WHERE radical in root_radicals)
          AND size(root_radicals) = 2
        RETURN root
        ORDER BY root.${L1}
        LIMIT ${parseInt(limit)}
      `;
    } else {
      // Standard combinate - any permutations (2-3 radicals)
      cypherQuery = `
        MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
        WHERE rp.radical IN $radicals
        WITH root, collect(rp.radical) as root_radicals
        WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) <= 3
          AND all(radical in $radicals WHERE radical in root_radicals)
          AND size([r in root_radicals WHERE r IN $radicals]) = size($radicals)
        RETURN root
        ORDER BY root.${L1}
        LIMIT ${parseInt(limit)}
      `;
    }

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
        type: 'root',
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'combinate',
      message: `Found ${roots.length} roots with combinate search`
    });

  } catch (error) {
    console.error('Error in search-combinate endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ====================================================================
// EXTENDED ROOTS ONLY (4+ RADICALS)
// Route: GET /search-extended
// Purpose: Search only quadriliteral and longer roots
// Features: Automatic 4+ radical filtering, optional radical filtering
// ====================================================================
router.get('/search-extended', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2, limit = 25 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });
    }

    const session = req.driver.session();
    let cypherQuery = `
      MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
      WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) >= 4
    `;
    
    let queryParams = {};
    const conditions = [];
    
    // Optional filtering by provided radicals
    if (r1 && r1 !== '*') {
      conditions.push('(rp.radical = $r1)');
      queryParams.r1 = r1;
    }
    if (r2 && r2 !== '*') {
      conditions.push('(rp.radical = $r2)');
      queryParams.r2 = r2;
    }
    if (r3 && r3 !== '*') {
      conditions.push('(rp.radical = $r3)');  
      queryParams.r3 = r3;
    }
    
    if (conditions.length > 0) {
      cypherQuery += ' AND (' + conditions.join(' OR ') + ')';
      cypherQuery += `
        WITH root, collect(rp.radical) as matched_radicals
        WHERE size(matched_radicals) > 0
      `;
    } else {
      cypherQuery += ' WITH root';
    }

    cypherQuery += `
      RETURN DISTINCT root
      ORDER BY root.${L1}
      LIMIT ${parseInt(limit)}
    `;

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
        type: 'root',
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'extended',
      message: `Found ${roots.length} extended roots (4+ radicals)`
    });

  } catch (error) {
    console.error('Error in search-extended endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;