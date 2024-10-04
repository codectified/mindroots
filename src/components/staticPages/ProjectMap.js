import React, { useEffect } from 'react';
import GraphVisualization from '../graph/GraphVisualization'; // Visualization component
import { executeQuery } from '../../services/apiService'; // API service for executing Cypher queries
import MiniMenu from '../navigation/MiniMenu'; // Optional menu component
import { useGraphData } from '../../contexts/GraphDataContext'; // Context to store graph data

const ProjectMap = () => {
  const { graphData, setGraphData } = useGraphData(); // Using context to store graph data

  // Query to fetch the Mindroots node and its connected subcategories
  const projectMapQuery = `
    MATCH (mindroots:Project {name: 'Mindroots'})-[:HAS_CATEGORY]->(category)
    OPTIONAL MATCH (category)-[:HAS_FEATURE|:HAS_SUBCATEGORY|:HAS_GAME]->(subCategory)
    RETURN mindroots, category, subCategory
  `;
  
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        // Execute the query to get the project map data
        const data = await executeQuery(projectMapQuery);
        const formattedData = formatNeo4jData(data); // Format Neo4j data into nodes and links
        setGraphData(formattedData); // Set the graph data for visualization
        console.log('Graph data:', formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    loadProjectData();
  }, []); // Only runs once when the component mounts

  const formatNeo4jData = (neo4jData) => {
    const nodes = [];
    const links = [];

    const nodeExists = (id) => nodes.some((node) => node.id === id); // Check if a node exists
    const linkExists = (source, target) => links.some((link) => link.source === source && link.target === target); // Check if a link exists

    neo4jData.forEach(record => {
      // Mindroots Node
      if (record.mindroots && !nodeExists(`mindroots_${record.mindroots.identity}`)) {
        const mindrootsNode = {
          id: `mindroots_${record.mindroots.identity}`,
          label: record.mindroots.properties.name,
          type: 'project',
          ...record.mindroots.properties,
        };
        nodes.push(mindrootsNode);
      }

      // Category Node
      if (record.category && !nodeExists(`category_${record.category.identity}`)) {
        const categoryNode = {
          id: `category_${record.category.identity}`,
          label: record.category.properties.name,
          type: 'category',
          ...record.category.properties,
        };
        nodes.push(categoryNode);

        // Link Mindroots to Category
        if (!linkExists(`mindroots_${record.mindroots.identity}`, `category_${record.category.identity}`)) {
          links.push({
            source: `mindroots_${record.mindroots.identity}`,
            target: `category_${record.category.identity}`,
          });
        }
      }

      // Subcategory or Feature Node
      if (record.subCategory && !nodeExists(`subCategory_${record.subCategory.identity}`)) {
        const subCategoryNode = {
          id: `subCategory_${record.subCategory.identity}`,
          label: record.subCategory.properties.name,
          type: record.subCategory.labels[0].toLowerCase(),
          color: record.subCategory.properties.color,
          status: record.subCategory.properties.status,
          ...record.subCategory.properties,
        };
        nodes.push(subCategoryNode);

        // Link Category to Subcategory
        if (!linkExists(`category_${record.category.identity}`, `subCategory_${record.subCategory.identity}`)) {
          links.push({
            source: `category_${record.category.identity}`,
            target: `subCategory_${record.subCategory.identity}`,
          });
        }
      }
    });

    return { nodes, links }; // Return the formatted nodes and links for visualization
  };

  return (
    <div className="project-map">
      <MiniMenu /> {/* Optional Menu */}

      {/* Render the graph visualization */}
      <GraphVisualization data={graphData} />
    </div>
  );
};

export default ProjectMap;