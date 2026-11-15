/*
 * MindRoots - Arabic Morphology Visualization Tool
 * Copyright (c) 2024 MindRoots Project
 * 
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
 * To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/4.0/
 */

require('dotenv').config(); // Load environment variables

const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const crypto = require('crypto');
const { rateLimit } = require('./middleware/rateLimit');

const app = express();
const port = 5001;

// nginx on the same box proxies to us. Without this every request looks like it
// comes from 127.0.0.1: per-IP rate limits become one shared limit and the logs
// show no real addresses. 'loopback' trusts only the local proxy, so a client
// can't fake its address with its own X-Forwarded-For header. Needs nginx to
// send `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`.
app.set('trust proxy', 'loopback');
app.disable('x-powered-by');

app.use(cors());
// Workspace uploads send base64 images (~10MB decoded); nothing else needs more than 100kb.
app.use('/api/workspace', express.json({ limit: '15mb' }));
app.use(express.json({ limit: '100kb' }));

// Static file serving for multi-tenant workspaces (never serve .token files)
app.use('/workspaces', express.static(path.join(__dirname, 'workspaces'), { dotfiles: 'deny' }));

// Backstop per-IP limit for the whole API (nginx's limit_req is the first line).
app.use('/api', rateLimit({ name: 'api', windowMs: 5 * 60 * 1000, perIp: 1500 }));

// Don't send database or internal error text to clients: for any 5xx answer,
// log the original body with a reference and send only a generic message.
// The admin-only /execute-query keeps its details for debugging.
app.use((req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 500 && req.authLevel !== 'admin') {
      const ref = crypto.randomBytes(4).toString('hex');
      console.error(`[error ${ref}] ${req.method} ${req.originalUrl}:`, JSON.stringify(body));
      return json({ error: 'Server error', ref });
    }
    return json(body);
  };
  next();
});

// Neo4j driver setup using environment variables
const driver = neo4j.driver(
  process.env.NEO4J_URI, 
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

// Middleware to make the Neo4j driver available to all routes
app.use((req, res, next) => {
  req.driver = driver;
  next();
});

// Use the api routes
app.use('/api', apiRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Last-resort error handler (malformed JSON, oversized bodies, thrown errors):
// no stack traces or messages to the client.
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status < 500) return res.status(status).json({ error: err.type === 'entity.too.large' ? 'Request too large' : 'Bad request' });
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Server error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});