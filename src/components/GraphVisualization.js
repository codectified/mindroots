import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeClick }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.nodes.length === 0) {
      console.log('No data to render');
      return;
    }

    console.log('Rendering data:', data);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous contents

    const width = svg.attr('width');
    const height = svg.attr('height');

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(d => {
        if (d.type === 'name') return width / 2; // Center the name node horizontally
        return d.index % 2 === 0 ? width / 3 : (2 * width) / 3; // Distribute other nodes symmetrically
      }).strength(0.5))
      .force('y', d3.forceY(d => {
        if (d.type === 'name') return height / 4; // Pull the name node towards the top
        if (d.type === 'word') return height / 2; // Place words in the middle
        return (3 * height) / 4; // Place forms and roots further down
      }).strength(0.5))
      .force('collide', d3.forceCollide(50)); // Add collision force to prevent overlap

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

    console.log('Appended nodes:', node);
    console.log('Appended links:', link);

    simulation
      .nodes(data.nodes)
      .on('tick', ticked);

    simulation.force('link')
      .links(data.links);

    function ticked() {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      text
        .attr('x', d => d.x)
        .attr('y', d => d.y);

      // Log positions less frequently
      if (Math.random() < 0.05) {
        console.log('Node positions:', node.data().map(d => ({ x: d.x, y: d.y })));
        console.log('Link positions:', link.data().map(d => ({
          source: { x: d.source.x, y: d.source.y },
          target: { x: d.target.x, y: d.target.y }
        })));
      }
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
