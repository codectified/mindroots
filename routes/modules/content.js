const express = require('express');
const { convertIntegers } = require('./utils');
const router = express.Router();

// Latest Analysis for News section
router.get('/latest-analysis', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis)
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
      } as latest_analysis
    `);

    if (result.records.length === 0) {
      return res.json({ 
        latest_analysis: null,
        message: "No analysis found" 
      });
    }

    const latestAnalysis = convertIntegers(result.records[0].get('latest_analysis'));
    res.json({ latest_analysis: latestAnalysis });
    
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    res.status(500).json({ 
      error: 'Error fetching latest analysis',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// All Previous Analyses for News section
router.get('/all-analyses', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis)
      WITH r, a, 
           a.created as timestamp,
           COALESCE(a.version, 1) as version
      ORDER BY timestamp DESC, version DESC
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
      } as analysis_entry
    `);

    if (result.records.length === 0) {
      return res.json({ 
        analyses: [],
        message: "No analyses found" 
      });
    }

    const analyses = result.records.map(record => 
      convertIntegers(record.get('analysis_entry'))
    );
    
    res.json({ analyses });
    
  } catch (error) {
    console.error('Error fetching all analyses:', error);
    res.status(500).json({ 
      error: 'Error fetching all analyses',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Root Headers for Previous Analyses (lightweight - no full analysis data)
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

// Single Analysis by Root ID (for on-demand loading)
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

// Latest Article for Main Menu
router.get('/latest-article', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (a:Article)
      ORDER BY a.created_at DESC
      LIMIT 1
      RETURN {
        article_id: id(a),
        signature: a.signature,
        title: a.title,
        subtitle: a.subtitle,
        text: a.text,
        created_at: a.created_at
      } as latest_article
    `);

    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: 'No articles found',
        message: 'No articles found in database' 
      });
    }

    const latestArticle = convertIntegers(result.records[0].get('latest_article'));
    res.json({ latest_article: latestArticle });
    
  } catch (error) {
    console.error('Error fetching latest article:', error);
    res.status(500).json({ 
      error: 'Error fetching latest article',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Article Headers for Previous Articles (lightweight)
router.get('/article-headers', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (a:Article)
      ORDER BY a.created_at DESC
      RETURN {
        article_id: id(a),
        signature: a.signature,
        title: a.title,
        subtitle: a.subtitle,
        created_at: a.created_at,
        text_preview: substring(a.text, 0, 100) + "..."
      } as article_header
    `);

    const headers = result.records.map(record => 
      convertIntegers(record.get('article_header'))
    );
    
    res.json({ headers });
    
  } catch (error) {
    console.error('Error fetching article headers:', error);
    res.status(500).json({ 
      error: 'Error fetching article headers',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Article by ID for lazy loading
router.get('/article-by-id/:articleId', async (req, res) => {
  const session = req.driver.session();
  try {
    const { articleId } = req.params;
    
    const result = await session.run(`
      MATCH (a:Article)
      WHERE id(a) = toInteger($articleId)
      RETURN {
        article_id: id(a),
        signature: a.signature,
        title: a.title,
        subtitle: a.subtitle,
        text: a.text,
        created_at: a.created_at
      } as article_data
    `, { articleId: parseInt(articleId) });

    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: 'Article not found',
        message: `No article found with ID ${articleId}` 
      });
    }

    const articleData = convertIntegers(result.records[0].get('article_data'));
    res.json({ article: articleData });
    
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    res.status(500).json({ 
      error: 'Error fetching article by ID',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

module.exports = router;