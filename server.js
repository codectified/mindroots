const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const port = 5001;

app.use(cors());

// Neo4j driver setup
const driver = neo4j.driver(
  'bolt://localhost', 
  neo4j.auth.basic('neo4j', 'raymond-guide-monarch-change-reward-8670') // Replace 'your_password' with your Neo4j password
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
