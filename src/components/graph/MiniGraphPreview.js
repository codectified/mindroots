import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * MiniGraphPreview - A static, non-interactive graph preview
 * Shows a fixed-layout visualization of root + word nodes
 * Used in InfoBubble to give visual preview before navigating to full graph
 */
const MiniGraphPreview = ({ data, width = 400, height = 300 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous contents

    // Create fixed positions for nodes in a radial layout
    const rootNode = data.nodes.find(n => n.type === 'root');
    const wordNodes = data.nodes.filter(n => n.type === 'word');

    if (!rootNode) return;

    // Position root at center
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.35;

    // Fixed positions
    rootNode.fx = centerX;
    rootNode.fy = centerY;

    // Position word nodes in an organic, non-symmetrical pattern
    // Use golden angle for natural spacing with radius variation
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

    wordNodes.forEach((node, i) => {
      // Vary the angle using golden angle for natural distribution
      const angle = i * goldenAngle;

      // Add radius variation: 0.8 to 1.2 of base radius for organic feel
      const radiusVariation = 0.8 + Math.random() * 0.4;
      const radius = baseRadius * radiusVariation;

      // Add small random offset for less perfect positioning
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;

      node.fx = centerX + radius * Math.cos(angle) + offsetX;
      node.fy = centerY + radius * Math.sin(angle) + offsetY;
    });

    // Color scale
    const getColor = (d) => {
      const colorMap = {
        'root': 'green',
        'word': 'red',
        'form': 'blue',
        'corpusitem': 'gold'
      };
      return colorMap[d.type] || '#999';
    };

    // Size scale for word nodes based on dataSize
    const sizeScale = d3.scaleLog()
      .domain([1, d3.max(wordNodes, d => d.dataSize || 1)])
      .range([3, 8])
      .clamp(true);

    // Draw links
    if (data.links && data.links.length > 0) {
      svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(data.links)
        .enter()
        .append('line')
        .attr('x1', d => {
          const source = data.nodes.find(n => n.id === (d.source.id || d.source));
          return source ? source.fx : 0;
        })
        .attr('y1', d => {
          const source = data.nodes.find(n => n.id === (d.source.id || d.source));
          return source ? source.fy : 0;
        })
        .attr('x2', d => {
          const target = data.nodes.find(n => n.id === (d.target.id || d.target));
          return target ? target.fx : 0;
        })
        .attr('y2', d => {
          const target = data.nodes.find(n => n.id === (d.target.id || d.target));
          return target ? target.fy : 0;
        })
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.6);
    }

    // Draw nodes
    svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('cx', d => d.fx)
      .attr('cy', d => d.fy)
      .attr('r', d => {
        if (d.type === 'root') return 10;
        if (d.type === 'word' && d.dataSize) return sizeScale(d.dataSize);
        return 5;
      })
      .attr('fill', d => getColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Draw label only for root node
    svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data([rootNode])
      .enter()
      .append('text')
      .attr('x', d => d.fx)
      .attr('y', d => d.fy - 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#333')
      .attr('font-weight', 'bold')
      .text(d => d.label || '')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

  }, [data, width, height]);

  return (
    <div style={{
      width: '100%',
      maxWidth: `${width}px`,
      margin: '0 auto',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      padding: '10px',
      backgroundColor: '#fafafa'
    }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: '#666',
        marginTop: '5px',
        fontStyle: 'italic'
      }}>
        Static preview - Click "View Graph →" for interactive exploration
      </div>
    </div>
  );
};

export default MiniGraphPreview;
