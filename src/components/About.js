import React, { useEffect, useState } from 'react';
import { executeQuery } from '../services/apiService';
import GraphVisualization from './GraphVisualization';
import ReactMarkdown from 'react-markdown';
import Menu from './Menu';
import aboutContent from '../content/about.md'; // Import the markdown file path

const About = () => {
  const [blurb, setBlurb] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the markdown content
    fetch(aboutContent)
      .then((res) => res.text())
      .then((text) => setBlurb(text))
      .catch((error) => console.error('Error loading markdown:', error));

    // Fetch the graph data
    const fetchGraphData = async () => {
      try {
        const query = `
          MATCH (n)-[r]->(m)
          RETURN n, r, m
        `;
        const data = await executeQuery(query);
        const formattedData = formatNeo4jData(data);
        setGraphData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      }
    };

    fetchGraphData();
  }, []);

  const formatNeo4jData = (neo4jData) => {
    const nodes = [];
    const links = [];
  
    neo4jData.forEach(record => {
      Object.values(record).forEach(field => {
        if (field.identity && field.labels) {
          const properties = field.properties;
          nodes.push({
            id: `${properties.name}_${field.labels[0].toLowerCase()}`,
            label: properties.name,
            type: field.labels[0].toLowerCase(),
            ...properties
          });
        }
      });
    });
  
    return { nodes, links };
  };

  return (
    <div className="about-page">
      <Menu />
      <ReactMarkdown>{blurb}</ReactMarkdown>

      <h2>Database Overview</h2>
      {loading ? <p>Loading graph visualization...</p> : <GraphVisualization data={graphData} />}
    </div>
  );
};

export default About;
