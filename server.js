require('dotenv').config(); // Load environment variables

const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});