import React, { useState, useEffect } from 'react';
import GraphVisualization from '../components/GraphVisualization'; // Visualization component
import { executeQuery } from '../services/apiService'; // API service for executing Cypher queries
import { useGraphData } from '../contexts/GraphDataContext'; // Context to store graph data
import Menu from '../components/Menu';

const SiteMap = () => {
  const { graphData, setGraphData, handleNodeClick } = useGraphData(); // Using context to store graph data and handle clicks

  // Query to fetch the site map nodes and their connections
  const siteMapQuery = `
    MATCH (menu:Menu)-[:HAS_ITEM]->(item)
    OPTIONAL MATCH (item)-[:HAS_ITEM]->(subItem)
    RETURN menu, item, subItem
  `;

  useEffect(() => {
    const loadSiteMapData = async () => {
      try {
        // Execute the query to get the site map data
        const data = await executeQuery(siteMapQuery);
        const formattedData = formatNeo4jData(data); // Format Neo4j data into nodes and links
        setGraphData(formattedData); // Set the graph data for visualization
        console.log('Graph data:', formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    loadSiteMapData();
  }, []); // Only runs once when the component mounts

  const formatNeo4jData = (neo4jData) => {
    const nodes = [];
    const links = [];

    const nodeExists = (id) => nodes.some((node) => node.id === id); // Check if a node exists
    const linkExists = (source, target) => links.some((link) => link.source === source && link.target === target); // Check if a link exists

    neo4jData.forEach(record => {
      // Menu Node
      if (record.menu && !nodeExists(`menu_${record.menu.identity}`)) {
        const menuNode = {
          id: `menu_${record.menu.identity}`,
          label: record.menu.properties.name,
          node_type: 'menu', // Use consistent casing
          color: record.menu.properties.color,
          route: record.menu.properties.route,
        };
        nodes.push(menuNode);
      }

      // Menu Item Node
      if (record.item && !nodeExists(`item_${record.item.identity}`)) {
        const itemNode = {
          id: `item_${record.item.identity}`,
          label: record.item.properties.name,
          node_type: 'menu', // Use consistent casing
          color: record.item.properties.color,
          route: record.item.properties.route,
        };
        nodes.push(itemNode);

        // Link Menu to Item
        if (!linkExists(`menu_${record.menu.identity}`, `item_${record.item.identity}`)) {
          links.push({
            source: `menu_${record.menu.identity}`,
            target: `item_${record.item.identity}`,
          });
        }
      }

      // SubMenu Item Node
      if (record.subItem && !nodeExists(`subItem_${record.subItem.identity}`)) {
        const subItemNode = {
          id: `subItem_${record.subItem.identity}`,
          label: record.subItem.properties.name,
          node_type: 'menu', // Use consistent casing
          color: record.subItem.properties.color,
          route: record.subItem.properties.route,
        };
        nodes.push(subItemNode);

        // Link Item to SubItem
        if (!linkExists(`item_${record.item.identity}`, `subItem_${record.subItem.identity}`)) {
          links.push({
            source: `item_${record.item.identity}`,
            target: `subItem_${record.subItem.identity}`,
          });
        }
      }
    });

    return { nodes, links }; // Return the formatted nodes and links for visualization
  };

  return (
    <div className="site-map">
      <Menu /> {/* Optional Menu */}
      {/* Render the graph visualization and handle node clicks */}
      <GraphVisualization data={graphData} onNodeClick={(node, event) => handleNodeClick(node, event)} />
    </div>
  );
};

export default SiteMap;