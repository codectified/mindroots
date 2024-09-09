import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeClick, onNodeRightClick }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const zoomRef = useRef();

  useEffect(() => {
    if (!data || data.nodes.length === 0) {
      console.log('No data to render');
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = containerRef.current.getBoundingClientRect();

    // Create a color scale for node types
    const color = d3.scaleOrdinal()
      .domain(['name', 'word', 'form', 'root'])
      .range(['gold', 'red', 'blue', 'green']);

    // Create a group to apply zoom and pan transformations
    const g = svg.append('g');

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 4))
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
      .force('collide', d3.forceCollide(60))
      .alphaDecay(0.01)
      .velocityDecay(0.9);

    // Create zoom behavior (works with pinch, scroll, etc.)
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke-width', 2)
      .attr('stroke', '#999');

    // Create nodes
    const node = g.append('g')
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
      .on('click', (event, d) => onNodeClick(d))
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        onNodeRightClick(d, event);
      });

    node.append('title')
      .text(d => d.label);

    // Create labels
    const text = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-1.2em')
      .text(d => d.label);

    simulation.nodes(data.nodes).on('tick', () => {
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
        .attr('y', d => d.y - 12);
    });

    simulation.force('link').links(data.links);

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

    // Handle resizing
    const handleResize = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svg.attr('width', width).attr('height', height);
      simulation.force('center', d3.forceCenter(width / 2, height / 2)).alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, onNodeClick, onNodeRightClick]);

  // Zoom in/out buttons
  const handleZoomIn = () => {
    d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.2);
  };

  const handleZoomOut = () => {
    d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.8);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', pointerEvents: 'none' }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ border: 'none', display: 'block', pointerEvents: 'auto' }}></svg>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: 10, right: 10, pointerEvents: 'auto' }}>
        <button onClick={handleZoomIn} style={{ fontSize: '20px', padding: '5px' }}>+</button>
        <button onClick={handleZoomOut} style={{ fontSize: '20px', padding: '5px' }}>−</button>
      </div>
    </div>
  );
};

export default GraphVisualization;