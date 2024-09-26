import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeClick, onNodeRightClick }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  const { width, height } = containerRef.current?.getBoundingClientRect() || { width: 800, height: 600 };

  useEffect(() => {
    if (!data || data.nodes.length === 0) {
      console.log('No data to render');
      return;
    }

    console.log('Rendering data:', data);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const zoomLayer = svg.append('g');
    const { width, height } = containerRef.current.getBoundingClientRect();

    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation(data.nodes) // PHYSICS
    .force('link', d3.forceLink(data.links).id(d => d.id).distance(link => {
      if (link.source.node_type === 'Word' || link.target.node_type === 'Word') {
        return 150; // Longer distance for word nodes
      }
      return 100; // Default distance
    }))
    .force('charge', d3.forceManyBody().strength(node => {
      if (node.node_type === 'Word') {
        return -80; // Stronger repulsion for word nodes
      }
      return -50; // Default repulsion
    }))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide(50))
    .alphaDecay(0.01)
    .velocityDecay(0.9);

// Color function based on node_type property
const getColor = (d) => {
  if (d.node_type === 'menu') {
    return d.color || 'gray'; // If node_type is Menu, use the color property or default to gray
  }

  // Handle other node types
  switch (d.node_type) {
    case 'Word':
      switch (d.word_type) {
        case 'phrase':
          return '#FFCCCC'; // Lightest red
        case 'verb':
          return '#FF6666'; // Medium red
        case 'noun':
          return '#CC0000'; // Darker red
        default:
          return '#660000'; // Darkest red
      }
    case 'Root':
      return 'green';
    case 'Form':
      return 'blue';
    case 'CorpusItem':
      return 'gold';
    default:
      return '#ccc';
  }
};

    const link = zoomLayer.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke-width', 1.5)
      .attr('stroke', '#bbb')
      .attr('opacity', 0.3);

    const node = zoomLayer.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', 12)
      .attr('fill', d => getColor(d))
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => onNodeClick(d, event))
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        onNodeRightClick(d, event);
      });

    node.append('title')
      .text(d => d.label);

    const text = zoomLayer.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .attr('x', 12)
      .attr('y', '.31em')
      .text(d => d.label);

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

    const handleResize = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svg.attr('viewBox', `0 0 ${width} ${height}`);
      simulation.force('center', d3.forceCenter(width / 2, height / 2)).alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, onNodeClick, onNodeRightClick]);

  return (
    <div ref={containerRef} style={{ width: '90%', height: '60vh', maxHeight: '100%', maxWidth: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ border: 'none', display: 'block' }}></svg>
    </div>
  );
};

export default GraphVisualization;