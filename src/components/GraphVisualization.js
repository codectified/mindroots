import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeClick }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.nodes.length === 0) {
      console.log('No data to render');
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous contents

    const width = svg.attr('width');
    const height = svg.attr('height');

    // Initialize positions
    data.nodes.forEach(node => {
      node.x = width / 2;
      node.y = height / 2;
    });

    const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide(50)) // Add collision force to prevent overlap
    .alphaDecay(0.005) // Even slower cooling rate for a dramatic slow effect
    .velocityDecay(0.6); // Lower velocity decay for slower motion
  

    const color = d3.scaleOrdinal()
      .domain(['name', 'word', 'form', 'root'])
      .range(['gold', 'red', 'blue', 'green']);

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke-width', 2)
      .attr('stroke', '#999');

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', 10)
      .attr('fill', d => color(d.type))
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => onNodeClick(d));

    node.append('title')
      .text(d => d.label);

    const text = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .attr('x', 12)
      .attr('y', '.31em')
      .text(d => d.label);


// Position the root and word nodes symmetrically
const rootNode = data.nodes.find(node => node.type === 'root');
const wordNode = data.nodes.find(node => node.type === 'word');

if (rootNode && wordNode) {
  const offset = 100; // Adjusts the horizontal distance between root and word nodes
  const verticalShift = 50; // Adjust this value to lower the root node

  // Swap the positions: root node on the right, word node on the left
  wordNode.fx = width / 2 - offset;
  wordNode.fy = height / 2;

  rootNode.fx = width / 2 + offset;
  rootNode.fy = height / 2 + verticalShift; // Lower the root node

  // Center the item node directly above the midpoint between the root and word nodes, but higher up
  const midX = (rootNode.fx + wordNode.fx) / 2;
  const itemNode = data.nodes.find(node => node.type === 'name');
  if (itemNode) {
    itemNode.fx = midX;
    itemNode.fy = height / 2 - 200; // Adjusted higher vertical position
  }
}

// Radial distribution of word nodes around the root when expanded
if (rootNode) {
  const childWordNodes = data.nodes.filter(node => node.type === 'word' && node.root_id === rootNode.id);
  
  // Start with an initial angle to distribute the nodes symmetrically
  const startAngle = Math.PI / 4; // Adjust this starting angle as needed
  const angleIncrement = (2 * Math.PI - startAngle * 2) / childWordNodes.length;
  
  childWordNodes.forEach((node, index) => {
    const angle = startAngle + index * angleIncrement;
    const radius = 100; // Distance from the root node
    node.fx = rootNode.fx + radius * Math.cos(angle);
    node.fy = rootNode.fy + radius * Math.sin(angle);
  });
}


    simulation
      .nodes(data.nodes)
      .on('tick', ticked);

    simulation.force('link')
      .links(data.links);

    function ticked() {
      link
        .attr('x1', d => validatePosition(d.source.x))
        .attr('y1', d => validatePosition(d.source.y))
        .attr('x2', d => validatePosition(d.target.x))
        .attr('y2', d => validatePosition(d.target.y));

      node
        .attr('cx', d => validatePosition(d.x))
        .attr('cy', d => validatePosition(d.y));

      text
        .attr('x', d => validatePosition(d.x))
        .attr('y', d => validatePosition(d.y));
    }

    function validatePosition(value) {
      return isNaN(value) ? 0 : value;
    }

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [data, onNodeClick]);

  return <svg ref={svgRef} width="800" height="600" style={{ border: '1px solid black' }}></svg>;
};

export default GraphVisualization;
