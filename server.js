const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const port = 5001;

app.use(cors());

// Neo4j Aura driver setup
const driver = neo4j.driver(
  'neo4j+s://f6ead924.databases.neo4j.io', // Neo4j Aura connection URI
  neo4j.auth.basic('omaribrahim1130@gmail.com', 'GVLw6Rd-#*Dqy_c') // Replace with your Neo4j Aura credentials
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
