import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeClick, onNodeRightClick }) => {
  const svgRef = useRef();
  const containerRef = useRef(); // For dynamic container sizing

  const { width, height } = containerRef.current?.getBoundingClientRect() || { width: 800, height: 600 };

  useEffect(() => {
    if (!data || data.nodes.length === 0) {
      console.log('No data to render');
      return;
    }

    console.log('Rendering data:', data);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous contents

    // Create a group that will be zoomable
    const zoomLayer = svg.append('g');

    // Dynamically get the width and height of the container
    const { width, height } = containerRef.current.getBoundingClientRect();

    // Set up zoom and pan behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5]) // Set zoom limits
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform); // Apply zoom and pan
      });

    svg.call(zoom); // Bind zoom behavior to the SVG element

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(d => {
        if (d.type === 'name') return width / 2;
        if (d.type === 'form') return width / 4;
        if (d.type === 'root') return (3 * width) / 4;
        if (d.type === 'word') return width / 2;
        return width / 2;
      }).strength(1))
      .force('y', d3.forceY(d => {
        if (d.type === 'name') return height / 4;
        if (d.type === 'form' || d.type === 'root') return height / 2;
        if (d.type === 'word') return height * 0.75;
        return height / 2;
      }).strength(1))
      .force('collide', d3.forceCollide(50))
      .alphaDecay(0.01)
      .velocityDecay(0.9);

    const color = d3.scaleOrdinal()
      .domain(['item', 'word', 'form', 'root'])
      .range(['gold', 'red', 'blue', 'green']);

    const link = zoomLayer.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke-width', 2)
      .attr('stroke', '#999');

    const node = zoomLayer.append('g')
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

    let pressTimer;

    function handleLongPress(event, d) {
      event.preventDefault(); // Prevent default browser behavior
      pressTimer = setTimeout(() => {
        onNodeRightClick(d, event);
      }, 500); // 500ms for long press
    }

    function cancelLongPress() {
      clearTimeout(pressTimer);
    }

    svg.on('touchend', cancelLongPress);
    svg.on('mouseup', cancelLongPress);

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
    <div ref={containerRef} style={{ width: '100%', height: '90vh', maxHeight: '100%', maxWidth: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ border: 'none', display: 'block' }}></svg>
    </div>
  );
};

export default GraphVisualization;