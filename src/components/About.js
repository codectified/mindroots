import React, { useState, useEffect } from 'react';
import GraphVisualization from './GraphVisualization';
import { executeQuery } from '../services/apiService'; // Import the service function

const About = () => {
  const [exampleData1, setExampleData1] = useState(null);
  const [exampleData2, setExampleData2] = useState(null);
  const [exampleData3, setExampleData3] = useState(null);

  const exampleQuery1 = `
    MATCH (n:Word)
    RETURN n
    ORDER BY rand()
    LIMIT 1
  `;

  const exampleQuery2 = `
    MATCH (r:Root)-[:DERIVES]->(w:Word)
    RETURN r, w
    ORDER BY rand()
    LIMIT 1
  `;

  const exampleQuery3 = `
    MATCH (f:Form)
    RETURN f
    ORDER BY rand()
    LIMIT 1
  `;

  useEffect(() => {
    fetchData(exampleQuery1, setExampleData1);
    fetchData(exampleQuery2, setExampleData2);
    fetchData(exampleQuery3, setExampleData3);
  }, []);

  const fetchData = async (query, setData) => {
    try {
      const data = await executeQuery(query);
      const formattedData = formatNeo4jData(data);
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const formatNeo4jData = (neo4jData) => {
    const nodes = [];
    const links = [];
  
    neo4jData.forEach(record => {
      Object.values(record).forEach(field => {
        if (field.identity && field.labels) {
          // It's a node
          nodes.push({
            id: field.identity.low,
            label: field.properties.arabic || field.properties.english || 'Unnamed Node', // Extract label based on properties
            type: field.labels[0].toLowerCase(),
          });
        } else if (field.start && field.end && field.type) {
          // It's a relationship
          links.push({
            source: field.start.low,
            target: field.end.low,
          });
        }
      });
    });
  
    return { nodes, links };
  };
  

  const handleNodeClick = (node) => {
    console.log("Node clicked:", node);
  };

  return (
    <div className="about-page">
      <h1>About MindRoots</h1>
      <p>
        MindRoots is a graphical ontological dictionary application that allows users to explore the connections between Arabic roots and their derived words.
      </p>

      <h2>Example 1: A Random Word Node</h2>
      {exampleData1 && <GraphVisualization data={exampleData1} onNodeClick={handleNodeClick} />}
      <p>
        This query retrieves a random word node from the database.
      </p>

      <h2>Example 2: A Root and Word Node</h2>
      {exampleData2 && <GraphVisualization data={exampleData2} onNodeClick={handleNodeClick} />}
      <p>
        This query returns a root and its derived word.
      </p>

      <h2>Example 3: A Random Form Node</h2>
      {exampleData3 && <GraphVisualization data={exampleData3} onNodeClick={handleNodeClick} />}
      <p>
        This query retrieves a random form node from the database.
      </p>
    </div>
  );
};

export default About;
