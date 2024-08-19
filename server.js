const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const port = 5001;

app.use(cors());

app.use(express.json());

// // Neo4j driver setup
// const driver = neo4j.driver(
//   'bolt://localhost', 
//   neo4j.auth.basic('neo4j', 'raymond-guide-monarch-change-reward-8670') // 
// );

// Neo4j Aura driver setup
const driver = neo4j.driver(
  'neo4j+s://0cbfce87.databases.neo4j.io', // Neo4j Aura connection URI
  neo4j.auth.basic('neo4j', 'WesStKZQAAf8rBZ6AJVQJnnP7t8WTlPVPQK2mZnmSKw') 
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
