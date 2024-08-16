import React, { useState, useEffect } from 'react';
import GraphVisualization from './GraphVisualization';
import { executeQuery } from '../services/apiService'; // Import the API service function

const About = () => {
  const [exampleData1, setExampleData1] = useState(null);
  const [exampleData2, setExampleData2] = useState(null);
  const [exampleData3, setExampleData3] = useState(null);
  const [exampleData4, setExampleData4] = useState(null);

  const exampleQuery1 = `
    // Example Query 1
    MATCH (n:NodeType)-[:RELATION]->(m:AnotherNodeType)
    RETURN n, m
  `;

  const exampleQuery2 = `
    // Example Query 2
    MATCH (n:NodeType)-[:RELATION]->(m:AnotherNodeType)
    RETURN n, m
  `;

  const exampleQuery3 = `
    // Example Query 3
    MATCH (n:NodeType)-[:RELATION]->(m:AnotherNodeType)
    RETURN n, m
  `;

  const exampleQuery4 = `
    // Example Query 4
    MATCH (n:NodeType)-[:RELATION]->(m:AnotherNodeType)
    RETURN n, m
  `;

  useEffect(() => {
    fetchData(exampleQuery1, setExampleData1);
    fetchData(exampleQuery2, setExampleData2);
    fetchData(exampleQuery3, setExampleData3);
    fetchData(exampleQuery4, setExampleData4);
  }, []);

  const fetchData = async (query, setData) => {
    try {
      const result = await executeQuery(query);
      const formattedData = formatNeo4jData(result);
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const formatNeo4jData = (neo4jData) => {
    const nodes = [];
    const links = [];

    neo4jData.forEach(record => {
      record._fields.forEach(field => {
        if (field.identity && field.labels) {
          // It's a node
          nodes.push({
            id: field.identity.low,
            label: field.properties.name || 'Unnamed Node',
            type: field.labels[0].toLowerCase()
          });
        } else if (field.start && field.end && field.type) {
          // It's a relationship
          links.push({
            source: field.start.low,
            target: field.end.low
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
        MindRoots is a graphical ontological dictionary application that allows users to explore the connections between Arabic roots and their derived words...
      </p>

      <h2>Example 1: Query Title 1</h2>
      {exampleData1 && <GraphVisualization data={exampleData1} onNodeClick={handleNodeClick} />}
      <p>
        This query shows how [explanation for query 1]...
      </p>

      <h2>Example 2: Query Title 2</h2>
      {exampleData2 && <GraphVisualization data={exampleData2} onNodeClick={handleNodeClick} />}
      <p>
        This query illustrates [explanation for query 2]...
      </p>

      <h2>Example 3: Query Title 3</h2>
      {exampleData3 && <GraphVisualization data={exampleData3} onNodeClick={handleNodeClick} />}
      <p>
        Here, we demonstrate [explanation for query 3]...
      </p>

      <h2>Example 4: Query Title 4</h2>
      {exampleData4 && <GraphVisualization data={exampleData4} onNodeClick={handleNodeClick} />}
      <p>
        Finally, this query reveals [explanation for query 4]...
      </p>
    </div>
  );
};

export default About;
