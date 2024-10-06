import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeClick, onNodeRightClick }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    if (!data || data.nodes.length === 0) {
      console.log('No data to render');
      return;
    }

    const svg = d3.select(svgRef.current);

    if (simulation) {
      simulation.stop();
    }

    svg.selectAll('*').remove(); // Clear previous contents

    // Create a group that will be zoomable
    const zoomLayer = svg.append('g');

    const { width, height } = containerRef.current.getBoundingClientRect();

    // Set up zoom and pan behavior once
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5]) // Set zoom limits
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform); // Apply zoom and pan
      });

    svg.call(zoom); // Bind zoom behavior to the SVG element

    // Custom node color function based on type and word_type
    const getColor = (d) => {
      if (d.type === 'word') {
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
      }
      const color = d3.scaleOrdinal()
        .domain(['name', 'word', 'form', 'root'])
        .range(['gold', 'red', 'blue', 'green']);
      return color(d.type);
    };

    // Force simulation setup
    const newSimulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(10))
      .force('charge', d3.forceManyBody().strength(-25))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(d => {
        if (d.type === 'name') return width / 2;
        if (d.type === 'form') return width / 4;
        if (d.type === 'root') return (3 * width) / 4;
        if (d.type === 'word') return width / 2;
        return width / 2;
      }).strength(1))
      .force('y', d3.forceY(d => {
        if (d.type === 'name') return height / 6; // Shift up
        if (d.type === 'form' || d.type === 'root') return height / 3; // Shift up
        if (d.type === 'word') return height / 2; // Shift up
        return height / 3; // Default to a higher position
      }).strength(1))
      .force('collide', d3.forceCollide(50))
      .alphaDecay(0.01)
      .velocityDecay(.992);

    // Append links
    const link = zoomLayer.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke-width', 1.5)
      .attr('stroke', '#bbb')
      .attr('opacity', 0.3);

    // Append nodes with custom color logic
    const node = zoomLayer.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', 12)
      .attr('fill', d => getColor(d)) // Use the getColor function
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => onNodeClick(d, event))
      .on('contextmenu', (event, d) => {
        event.preventDefault();
        onNodeRightClick(d, event);
      });

    // Add node labels
    node.append('title').text(d => d.label);

    const text = zoomLayer.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .attr('x', 12)
      .attr('y', '.31em')
      .text(d => d.label);

    newSimulation.nodes(data.nodes).on('tick', () => {
      // Find the minimum Y value (the highest node)
      const minY = d3.min(data.nodes, d => d.y);

      // Shift all nodes upwards by the difference between minY and a desired top position
      const topOffset = height / 7  // A small offset from the top of the screen
      const shiftY = topOffset - minY;

      // Apply the shift
      node.attr('cx', d => d.x)
        .attr('cy', d => d.y + shiftY);

      text.attr('x', d => d.x)
        .attr('y', d => d.y + shiftY);

      link.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y + shiftY)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y + shiftY);
    });

    newSimulation.force('link').links(data.links);

    setSimulation(newSimulation);

    function dragstarted(event, d) {
      if (!event.active) newSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) newSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    const handleResize = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      svg.attr('viewBox', `0 0 ${width} ${height}`);
      newSimulation.force('center', d3.forceCenter(width / 2, height / 2)).alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (newSimulation) newSimulation.stop();
    };
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: '90%', height: '90vh', maxHeight: '100%', maxWidth: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ border: 'none', display: 'block' }}></svg>
    </div>
  );
};

export default GraphVisualization;