import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWordShade } from '../../contexts/WordShadeContext';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { useShowLinks } from '../selectors/ShowLinksToggle';
import NodeContextMenu from './NodeContextMenu';
import NodeInspector from './NodeInspector';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeClick }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [simulation, setSimulation] = useState(null);

  const { isAdvancedMode } = useAdvancedMode();
  const { contextMenu, setContextMenu, handleContextMenuAction, nodeInspectorData, setNodeInspectorData } = useGraphData();
  const { wordShadeMode } = useWordShade();
  const { showLinks, showLinkLabels } = useShowLinks();

  // Enhanced click handler that checks for advanced mode
  const handleNodeClick = useCallback((event, d) => {
    if (isAdvancedMode) {
      // In advanced mode, show context menu
      const position = {
        x: event.pageX,
        y: event.pageY
      };
      setContextMenu({ node: d, position });
    } else {
      // In guided mode, use original behavior
      onNodeClick(d, event);
    }
  }, [isAdvancedMode, onNodeClick, setContextMenu]);

  // Context menu action handler
  const handleMenuAction = useCallback((action, node) => {
    handleContextMenuAction(action, node);
  }, [handleContextMenuAction]);

  // Close context menu handler
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, [setContextMenu]);

  // Close node inspector handler
  const handleCloseInspector = useCallback(() => {
    setNodeInspectorData(null);
  }, [setNodeInspectorData]);

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
        if (wordShadeMode === 'grammatical') {
          // Grammatical color logic
          switch (d.word_type) {
            case 'phrase': return '#FFCCCC';
            case 'verb': return '#FF6666';
            case 'noun': return '#CC0000';
            default: return '#660000';
          }
        } else if (wordShadeMode === 'ontological') {
          // Ontological color logic
          switch (d.classification) {
            case 'Concrete': return '#CC0000'; // Light Blue
            case 'Abstract': return '#FFCCCC'; // Medium Blue
            default: return '#660000'; // Darker Blue
          }
        } else if (wordShadeMode === 'none') {
          // No word shading - use default red for all word nodes
          return 'red';
        }
      }
      // Default for non-word nodes
      return d3.scaleOrdinal()
        .domain(['corpusitem', 'word', 'form', 'root'])
        .range(['gold', 'red', 'blue', 'green'])(d.type);
    };


    const sizeScale = d3.scaleLog()
      .domain([1, 27521]) // Log scale works better when we avoid 0, so start from 1
      .range([4, 12]) // Small nodes start at 4px, largest ones capped at 12px
      .clamp(true); // Ensure that sizes stay within the range

    // Set up the force simulation with adjusted charge and link forces
    const newSimulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links)
        .id(d => d.id)
        .distance(50) // Adjusted to spread nodes farther apart
      )
      .force('charge', d3.forceManyBody()
        .strength(d => d.type === 'word' ? -350 * sizeScale(d.dataSize) : -100)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(d => {
        if (d.type === 'corpusitem') return width / 2;
        if (d.type === 'form') return width / 4;
        if (d.type === 'root') return (3 * width) / 4;;
        if (d.type === 'word') return width / 2;
        return width / 2;
      }).strength(1))
      .force('y', d3.forceY(d => {
        if (d.type === 'corpusitem') return height / 9; // Shift up
        if (d.type === 'form' || d.type === 'root') return height / 3; // Shift up
        if (d.type === 'word') return height / 2; // Shift up
        return height / 3; // Default to a higher position
      }).strength(1))
      .force('collide', d3.forceCollide(d => d.type === 'word' ? sizeScale(d.dataSize) + 15 : 50)) // Sets collision radius: 'word' nodes vary based on size; others have fixed radius (10).
      .alphaDecay(0.02) // Alpha decay for stability
      .velocityDecay(0.992); // Adjusted velocity decay

    // Append links with enhanced styling based on relationship type
    const link = zoomLayer.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', d => {
        // ETYM links are highlighted in gold, others remain gray
        return d.type === 'ETYM' ? '#FFD700' : '#999';
      })
      .attr('stroke-opacity', d => {
        // ETYM links are more opaque for visibility, others use 10% or hidden
        return d.type === 'ETYM' ? 0.9 : (showLinks ? 0.1 : 0);
      })
      .attr('stroke-width', d => {
        // Vary stroke width based on relationship type
        if (d.type) {
          switch (d.type) {
            case 'ETYM': return 2.5; // Thicker for ETYM links
            case 'HAS_WORD': return 2;
            case 'HAS_ROOT': return 1.5;
            case 'HAS_FORM': return 1.5;
            default: return 1;
          }
        }
        return 1.5; // Default for backward compatibility
      });

    // Link labels - conditionally render based on showLinkLabels
    const linkLabel = showLinks && showLinkLabels ? zoomLayer.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(data.links)
      .enter().append('text')
      .text(d => {
        // Map link types to cleaner display labels based on context
        if (d.type === 'HAS_WORD') {
          // Check source node type to determine appropriate label
          if (d.source.type === 'root') {
            return 'ROOT';
          } else if (d.source.type === 'corpusitem') { // corpus item nodes
            return 'WORD';
          } else {
            return 'WORD'; // default fallback for HAS_WORD
          }
        }
        
        const labelMap = {
          'HAS_ROOT': 'ROOT', 
          'HAS_FORM': 'FORM',
          'ETYM': 'ETYMON'
        };
        return labelMap[d.type] || d.type || '';
      })
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .attr('dy', '-2px')
      .style('pointer-events', 'none')
      .style('font-family', 'Noto Sans, sans-serif') : null;

    // Append nodes with custom color logic and size based on dataSize only for Word nodes
    const node = zoomLayer.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      // Adjust node radius based on dataSize, only for Word nodes
      .attr('r', d => {
        if (d.type === 'word') {
          if (d.dataSize === 0) return 1; // Very small size for zero data size
          return sizeScale(d.dataSize);    // Use log scale for Word nodes
        }
        return 10; // Default size for non-Word nodes
      })
      .attr('fill', d => getColor(d)) // Use the getColor function
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', handleNodeClick);

    // Add node labels
    node.append('title').text(d => d.label);

    const text = zoomLayer.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .attr('x', 12)
      .attr('y', '.31em')
      .text(d => d.label)
      .style('pointer-events', 'none') // Make text non-clickable
      .style('user-select', 'none')    // Prevent text selection
      .style('-webkit-user-select', 'none')
      .style('-moz-user-select', 'none')
      .style('-ms-user-select', 'none');

    newSimulation.nodes(data.nodes).on('tick', () => {
      // Find the minimum Y value (the highest node)
      const minY = d3.min(data.nodes, d => d.y);

      // Shift all nodes upwards by the difference between minY and a desired top position
      const topOffset = height / 7;  // A small offset from the top of the screen
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

      // Position link labels at midpoint of links
      if (linkLabel) {
        linkLabel.attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2 + shiftY);
      }
    });

    newSimulation.force('link').links(data.links);

    setSimulation(newSimulation);

    function dragstarted(event, d) {
      if (!event.active) newSimulation.alphaTarget(0.3).restart(); // Restart simulation on drag
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) newSimulation.alphaTarget(0); // Restore alpha after dragging
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
  }, [data, handleNodeClick, showLinks, showLinkLabels]);

  return (
    <div ref={containerRef} style={{ width: '90%', height: '90vh', maxHeight: '100%', maxWidth: '100%', position: 'relative' }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ border: 'none', display: 'block' }}></svg>
      
      
      {/* Render context menu in advanced mode */}
      {contextMenu && (
        <NodeContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          onAction={handleMenuAction}
        />
      )}
      
      {/* Render node inspector */}
      {nodeInspectorData && (
        <NodeInspector
          nodeData={nodeInspectorData}
          onClose={handleCloseInspector}
        />
      )}
    </div>
  );
};

export default GraphVisualization;