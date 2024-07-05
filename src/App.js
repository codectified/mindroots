const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const apiRoutes = require('./routes/api'); // Import the API routes

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Neo4j driver setup
const driver = neo4j.driver(
  'bolt://localhost', 
  neo4j.auth.basic('neo4j', 'raymond-guide-monarch-change-reward-8670') // 
);

// Make the driver available to the routes
app.use((req, res, next) => {
  req.driver = driver;
  next();
});

// Use the API routes
app.use('/api', apiRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
