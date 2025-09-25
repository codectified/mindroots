const express = require('express');
const { convertIntegers } = require('./utils');
const router = express.Router();

// ⚠️ DEPRECATED LEGACY SEARCH ROUTES
// These routes use hardcoded r1, r2, r3 properties and are marked for future migration
// Use the RadicalPosition-based routes in search-modern.js instead
//
// Legacy endpoints included:
// - /rootbyletters - Basic hardcoded position search
// - /geminate-roots - Hardcoded biradical logic  
// - /triliteral-roots - Hardcoded triradical logic
// - /extended-roots - Hardcoded extended root logic
//
// These routes are incompatible with Corpus 2 hierarchical IDs (surah:ayah:word)
// and do not support the new RadicalPosition system

// ⚠️ DEPRECATED: Basic hardcoded position search
// Uses hardcoded r1, r2, r3 properties
// Migrate to /search-roots endpoint for modern RadicalPosition-based search
router.get('/rootbyletters', async (req, res) => {
  const { r1, r2, r3, L1, L2, searchType } = req.query;
  const session = req.driver.session();

  try {
    let query = 'MATCH (root:Root)';
    const conditions = [];
    const params = {};

    // (1) Always consider r1 and r2 if they're set
    if (r1) {
      conditions.push('root.r1 = $r1');
      params.r1 = r1;
    }
    if (r2) {
      conditions.push('root.r2 = $r2');
      params.r2 = r2;
    }

    // (2) r3 logic:
    // If r3 === "NoR3" and searchType = "Geminate", we skip matching root.r3
    // Else if r3 is a letter, we add that condition
    if (r3 && r3 !== 'NoR3') {
      conditions.push('root.r3 = $r3');
      params.r3 = r3;
    }

    // (3) Distinguish which root types to fetch
    switch (searchType) {
      case 'Geminate':
        // Match geminate only
        conditions.push('root.root_type = "Geminate"');
        break;

      case 'Extended':
        // Quadriliteral or beyond
        conditions.push(`
          root.root_type IN [
            "Quadriliteral", 
            "Quintiliteral", 
            "Hexaliteral", 
            "Heptaliteral", 
            "BeyondTriliteral"
          ]
        `);
        break;

      case 'Triliteral':
      default:
        // If user doesn't specify or picks "Triliteral", then restrict to triliteral only
        conditions.push('root.root_type = "Triliteral"');
        break;
    }

    // (4) Build the WHERE clause
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // (5) Count total
    const countQuery = query + ' RETURN COUNT(root) AS total';
    const countResult = await session.run(countQuery, params);
    const total = countResult.records[0]?.get('total')?.low || 0;

    // (6) Fetch up to 25
    query += ' RETURN root LIMIT 25';
    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map((rec) => {
        const props = rec.get('root').properties;
        const convertedProps = convertIntegers(props);
        return {
          ...convertedProps,
          id: `root_${Number(convertedProps.root_id?.low !== undefined ? convertedProps.root_id.low : convertedProps.root_id)}`,
          type: 'root',
          label: L2 === 'off' ? convertedProps[L1] : `${convertedProps[L1]} / ${convertedProps[L2]}`,
          root_id: convertedProps.root_id,
        };
      });

      res.json({ roots, total });
    } else {
      res.status(404).json({ error: 'No roots found' });
    }
  } catch (error) {
    console.error('Error fetching root by letters:', error);
    res.status(500).json({ error: 'Error fetching root by letters' });
  } finally {
    await session.close();
  }
});

// ⚠️ DEPRECATED: Hardcoded biradical logic
// Uses hardcoded root_type = "Geminate" and r1, r2 properties
// Migrate to /search-roots with None wildcard for biradical searches
router.get('/geminate-roots', async (req, res) => {
  const { r1, r2, L1, L2 } = req.query;
  const session = req.driver.session();

  try {
    let query = 'MATCH (root:Root)';
    const conditions = ['root.root_type = "Geminate"'];
    const params = {};

    if (r1) {
      conditions.push('root.r1 = $r1');
      params.r1 = r1;
    }
    if (r2) {
      conditions.push('root.r2 = $r2');
      params.r2 = r2;
    }

    query += ' WHERE ' + conditions.join(' AND ') + ' RETURN root LIMIT 25';
    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map(record => {
        const root = record.get('root').properties;
        const convertedRoot = convertIntegers(root);
        return {
          ...convertedRoot,
          id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
          type: 'root',
          label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`,
          root_id: convertedRoot.root_id,
        };
      });

      res.json({ roots, total: roots.length });
    } else {
      res.status(404).json({ error: 'No geminate roots found' });
    }
  } catch (error) {
    console.error('Error fetching geminate roots:', error);
    res.status(500).json({ error: 'Error fetching geminate roots' });
  } finally {
    await session.close();
  }
});

// ⚠️ DEPRECATED: Hardcoded triradical logic  
// Uses hardcoded root_type = "Triliteral" and r1, r2, r3 properties
// Migrate to /search-roots or /search-combinate endpoints
router.get('/triliteral-roots', async (req, res) => {
  const { r1, r2, r3, L1, L2 } = req.query;
  const session = req.driver.session();

  try {
    let query = 'MATCH (root:Root)';
    const conditions = ['root.root_type = "Triliteral"'];
    const params = {};

    // Add conditions for R1 and R2
    if (r1 && r1 !== '*') {
      conditions.push('root.r1 = $r1');
      params.r1 = r1;
    }
    if (r2 && r2 !== '*') {
      conditions.push('root.r2 = $r2');
      params.r2 = r2;
    }

    // Handle R3
    if (r3 === 'NoR3') {
      // Geminate case; exclude R3
      conditions.push('root.r3 IS NULL');
    } else if (r3 && r3 !== '*') {
      // Specific triliteral case
      conditions.push('root.r3 = $r3');
      params.r3 = r3;
    }

    // Ensure no additional radicals exist
    conditions.push('root.r4 IS NULL');
    conditions.push('root.r5 IS NULL');
    conditions.push('root.r6 IS NULL');

    query += ' WHERE ' + conditions.join(' AND ') + ' RETURN root LIMIT 25';

    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map((record) => {
        const root = record.get('root').properties;
        const convertedRoot = convertIntegers(root);
        return {
          ...convertedRoot,
          id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
          type: 'root',
          label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`,
          root_id: convertedRoot.root_id,
        };
      });

      res.json({ roots, total: roots.length });
    } else {
      res.status(404).json({ error: 'No triliteral roots found' });
    }
  } catch (error) {
    console.error('Error fetching triliteral roots:', error);
    res.status(500).json({ error: 'Error fetching triliteral roots' });
  } finally {
    await session.close();
  }
});

// ⚠️ DEPRECATED: Hardcoded extended root logic
// Uses hardcoded root_type IN [Quadriliteral, ...] and r1, r2, r3 properties  
// Migrate to /search-extended endpoint for RadicalPosition-based extended root search
router.get('/extended-roots', async (req, res) => {
  const { r1, r2, r3, L1, L2 } = req.query;
  const session = req.driver.session();

  try {
    let query = 'MATCH (root:Root)';
    const conditions = [
      `root.root_type IN [
        "Quadriliteral",
        "Quintiliteral",
        "Hexaliteral",
        "Heptaliteral",
        "BeyondTriliteral"
      ]`,
    ];
    const params = {};

    if (r1) {
      conditions.push('root.r1 = $r1');
      params.r1 = r1;
    }
    if (r2) {
      conditions.push('root.r2 = $r2');
      params.r2 = r2;
    }
    if (r3) {
      conditions.push('root.r3 = $r3');
      params.r3 = r3;
    }

    query += ' WHERE ' + conditions.join(' AND ') + ' RETURN root LIMIT 25';
    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map(record => {
        const root = record.get('root').properties;
        const convertedRoot = convertIntegers(root);
        return {
          ...convertedRoot,
          id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
          type: 'root',
          label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`,
          root_id: convertedRoot.root_id,
        };
      });

      res.json({ roots, total: roots.length });
    } else {
      res.status(404).json({ error: 'No extended roots found' });
    }
  } catch (error) {
    console.error('Error fetching extended roots:', error);
    res.status(500).json({ error: 'Error fetching extended roots' });
  } finally {
    await session.close();
  }
});

module.exports = router;