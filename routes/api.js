const express = require('express');
const { authenticateAPI } = require('../middleware/auth');
const router = express.Router();

// CORS Middleware
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');  // Adjust according to your security policy
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  
  // If the request method is OPTIONS, send a response with status 200 and end the request
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// Import modular route modules
const corpusRoutes = require('./modules/corpus');
const graphRoutes = require('./modules/graph');
const searchModernRoutes = require('./modules/search-modern');
const searchLegacyRoutes = require('./modules/search-legacy');
const gptAdminRoutes = require('./modules/gpt-admin');
const lexiconRoutes = require('./modules/lexicon');
const inspectionRoutes = require('./modules/inspection');
const contentRoutes = require('./modules/content');

// Mount modular route modules
router.use('/', corpusRoutes);           // Corpus data operations
router.use('/', graphRoutes);            // Graph expansion and visualization  
router.use('/', searchModernRoutes);     // Modern RadicalPosition-based search (production)
router.use('/', searchLegacyRoutes);     // Legacy hardcoded r1/r2/r3 search (deprecated)
router.use('/', gptAdminRoutes);         // GPT integration and admin queries
router.use('/', lexiconRoutes);          // Dictionary and lexicon entries
router.use('/', inspectionRoutes);       // Node inspection, navigation, and validation
router.use('/', contentRoutes);          // Articles and analyses content

module.exports = router;