import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  
  // Stage 0: Layout mode and zoom persistence
  const [layoutMode] = useState('force'); // 'force' | 'computed'
  const [enableOrbitalMode, setEnableOrbitalMode] = useState(false); // Stage 2: Feature flag
  const lastTransform = useRef(null); // Persist zoom transform

  // Stage 2: Orbital positioning configuration (memoized to prevent re-renders)
  const ORBITAL_CONFIG = useMemo(() => ({
    anchors: {
      root: { x: 0.65, y: 0.45 },  // RIGHT side anchor
      form: { x: 0.35, y: 0.45 }   // LEFT side anchor (will be distributed for multiple forms)
    },
    wedges: {
      root: { min: -60, max: 60 },     // Upward-starting RIGHT wedge
      form: { min: 120, max: 240 }     // Upward-starting LEFT wedge
    },
    orbits: {
      verbs: { inner: 140, outer: 240 }, // Push verbs further out to avoid collisions
      nouns: { inner: 290, outer: 450 }  // Push nouns even further out
    },
    packing: {
      ringSpacingMultiplier: 2.5,  // Dramatically more space between rings
      marginPx: 45,                // Much larger margins for labels + breathing room
      minAngularSeparation: 25     // Minimum degrees between nodes in same ring
    }
  }), []);

  const { isAdvancedMode } = useAdvancedMode();
  const { contextMenu, setContextMenu, handleContextMenuAction, nodeInspectorData, setNodeInspectorData } = useGraphData();
  const { wordShadeMode } = useWordShade();
  const { showLinks, showLinkLabels } = useShowLinks();

  // Stage 0: Metrics logging function
  const logGraphMetrics = useCallback((nodes) => {
    const wordNodes = nodes.filter(n => n.type === 'word');
    const dataSizes = wordNodes.map(n => n.dataSize || 0).filter(s => s > 0);
    
    const metrics = {
      totalNodes: nodes.length,
      wordNodes: wordNodes.length,
      labels: nodes.filter(n => n.label).length,
      avgDataSize: dataSizes.length > 0 ? (dataSizes.reduce((a, b) => a + b, 0) / dataSizes.length).toFixed(2) : 0,
      minDataSize: dataSizes.length > 0 ? Math.min(...dataSizes) : 0,
      maxDataSize: dataSizes.length > 0 ? Math.max(...dataSizes) : 0,
      layoutMode: layoutMode
    };
    
    console.log('📊 Graph Metrics:', metrics);
    return metrics;
  }, [layoutMode]);

  // Stage 1: Label positioning helpers
  const computeLabelAnchor = useCallback((node, width, height) => {
    const nodeRadius = node.type === 'word' ? 
      (node.dataSize === 0 ? 1 : Math.max(4, Math.min(12, Math.log(node.dataSize || 1) * 2))) : 10;
    
    // Calculate angle from graph center
    const centerX = width / 2;
    const centerY = height / 2;
    const dx = node.x - centerX;
    const dy = node.y - centerY;
    const angle = Math.atan2(dy, dx);
    
    // Offset label anchor 14px from node edge
    const labelOffset = 14;
    const totalOffset = nodeRadius + labelOffset;
    
    return {
      x: node.x + Math.cos(angle) * totalOffset,
      y: node.y + Math.sin(angle) * totalOffset,
      nodeRadius: nodeRadius
    };
  }, []);

  // Stage 1: One-shot label separation
  const separateLabels = useCallback((labelAnchors, maxIterations = 15, maxNudge = 5) => {
    const anchors = [...labelAnchors]; // Copy to avoid mutation
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let moved = false;
      
      for (let i = 0; i < anchors.length; i++) {
        for (let j = i + 1; j < anchors.length; j++) {
          const a1 = anchors[i];
          const a2 = anchors[j];
          
          const dx = a2.x - a1.x;
          const dy = a2.y - a1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = 24; // Minimum distance between label centers
          
          if (distance < minDistance && distance > 0) {
            const overlap = minDistance - distance;
            const moveDistance = Math.min(overlap / 2, maxNudge);
            
            const nx = dx / distance;
            const ny = dy / distance;
            
            a1.x -= nx * moveDistance;
            a1.y -= ny * moveDistance;
            a2.x += nx * moveDistance;
            a2.y += ny * moveDistance;
            
            moved = true;
          }
        }
      }
      
      if (!moved) break; // Early termination if no overlaps
    }
    
    return anchors;
  }, []);

  // Stage 2: Orbital positioning helpers
  const getNodeRadius = useCallback((node) => {
    if (node.type === 'word') {
      if (node.dataSize === 0) return 1;
      return Math.max(4, Math.min(12, Math.log(node.dataSize || 1) * 2));
    }
    return 10;
  }, []);

  const shouldUseOrbitalPositioning = useCallback((data) => {
    // Use orbital positioning when we have clear parent-child relationships
    // For now, enable it when we have both root/form nodes and word nodes
    const hasRootOrForm = data.nodes.some(n => n.type === 'root' || n.type === 'form');
    const hasWords = data.nodes.some(n => n.type === 'word');
    return enableOrbitalMode && hasRootOrForm && hasWords;
  }, [enableOrbitalMode]);

  const buildParentChildMap = useCallback((nodes, links) => {
    const parentMap = new Map(); // childId -> parentNode
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      // Find the actual node objects
      const sourceNode = nodes.find(n => n.id === sourceId);
      const targetNode = nodes.find(n => n.id === targetId);
      
      if (sourceNode && targetNode) {
        // Root/Form -> Word relationships
        if ((sourceNode.type === 'root' || sourceNode.type === 'form') && targetNode.type === 'word') {
          parentMap.set(targetId, sourceNode);
        }
      }
    });
    
    return parentMap;
  }, []);

  const computeOrbitalPositions = useCallback((data, width, height) => {
    if (!shouldUseOrbitalPositioning(data)) {
      return new Map(); // Return empty map if not using orbital positioning
    }

    const parentChildMap = buildParentChildMap(data.nodes, data.links);
    const positionMap = new Map(); // nodeId -> {x, y, ...metadata}
    
    // Group words by parent and POS type
    const groupedNodes = new Map(); // "parentId:posType" -> [nodes]
    
    data.nodes.forEach(node => {
      if (node.type === 'word') {
        const parent = parentChildMap.get(node.id);
        if (parent) {
          const wordType = node.word_type || 'noun';
          const key = `${parent.id}:${wordType}`;
          
          if (!groupedNodes.has(key)) {
            groupedNodes.set(key, []);
          }
          groupedNodes.get(key).push(node);
        }
      } else if (node.type === 'root' || node.type === 'form') {
        // Position anchor nodes with special handling for multiple forms
        const config = ORBITAL_CONFIG;
        const baseAnchor = config.anchors[node.type];
        
        if (node.type === 'form') {
          // Count total form nodes and distribute them vertically
          const formNodes = data.nodes.filter(n => n.type === 'form');
          const formIndex = formNodes.findIndex(f => f.id === node.id);
          const totalForms = formNodes.length;
          
          let yOffset = 0;
          if (totalForms > 1) {
            // Distribute forms vertically around the base anchor
            const spacing = 0.15; // 15% of height between forms
            const totalSpacing = (totalForms - 1) * spacing;
            const startY = baseAnchor.y - (totalSpacing / 2);
            yOffset = (startY + formIndex * spacing) - baseAnchor.y;
          }
          
          positionMap.set(node.id, {
            x: baseAnchor.x * width,
            y: (baseAnchor.y + yOffset) * height,
            isAnchor: true,
            formIndex: formIndex
          });
        } else {
          // Root nodes use base anchor
          positionMap.set(node.id, {
            x: baseAnchor.x * width,
            y: baseAnchor.y * height,
            isAnchor: true
          });
        }
      }
    });
    
    // Sort each group deterministically and calculate orbital positions
    groupedNodes.forEach((nodes, key) => {
      const [parentId, posType] = key.split(':');
      const parent = data.nodes.find(n => n.id === parentId);
      
      if (!parent) return;
      
      // Sort nodes deterministically
      const sortedNodes = [...nodes].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
      
      const config = ORBITAL_CONFIG;
      
      // Get the actual positioned anchor for this parent (important for distributed forms)
      const parentPosition = positionMap.get(parent.id);
      const anchor = parentPosition ? 
        { x: parentPosition.x, y: parentPosition.y } :
        {
          x: config.anchors[parent.type].x * width,
          y: config.anchors[parent.type].y * height
        };
      
      const isVerb = posType === 'verb';
      const orbit = isVerb ? config.orbits.verbs : config.orbits.nouns;
      const wedge = config.wedges[parent.type];
      const wedgeSpan = wedge.max - wedge.min;
      
      // Special handling for small node counts
      if (sortedNodes.length === 1) {
        // Single node: place at a nice angle, not horizontally
        const singleNodeAngle = parent.type === 'root' ? -20 : 200; // Slight upward angle
        const singleNodeRadius = isVerb ? orbit.inner : orbit.inner + 50; // Modest distance
        const angle = singleNodeAngle * (Math.PI / 180);
        
        const x = anchor.x + Math.cos(angle) * singleNodeRadius;
        const y = anchor.y + Math.sin(angle) * singleNodeRadius;
        
        positionMap.set(sortedNodes[0].id, {
          x, y, angle: singleNodeAngle, ring: 0,
          orbit: isVerb ? 'verbs' : 'nouns',
          parent: parent.type
        });
        return; // Skip the rest of the ring packing logic
      }

      // Calculate ring parameters with dramatically increased label-aware spacing
      const maxNodeDiameter = Math.max(...sortedNodes.map(n => getNodeRadius(n) * 2));
      const labelSpaceEstimate = 80; // Larger estimate for label + halo space
      const totalNodeSpace = maxNodeDiameter + labelSpaceEstimate + config.packing.marginPx;
      const ringSpacing = config.packing.ringSpacingMultiplier * totalNodeSpace;
      const radiusRange = orbit.outer - orbit.inner;
      const numRings = Math.max(1, Math.floor(radiusRange / ringSpacing));
      
      // Distribute nodes more evenly across rings
      const nodesPerRing = Math.ceil(sortedNodes.length / numRings);
      
      // Position each node in its ring
      sortedNodes.forEach((node, index) => {
        const ringIndex = Math.floor(index / nodesPerRing);
        const radius = orbit.inner + (ringIndex * ringSpacing);
        
        const positionInRing = index % nodesPerRing;
        const currentRingSize = Math.min(nodesPerRing, sortedNodes.length - ringIndex * nodesPerRing);
        
        // STRICT wedge boundary enforcement - never allow overflow
        const edgePadding = 10; // Degrees of padding from wedge edges  
        const wedgeUsable = wedgeSpan - (edgePadding * 2);
        const maxAngularStep = wedgeUsable / Math.max(1, currentRingSize);
        
        // Force nodes to fit within wedge, even if they're crowded
        const angularStep = Math.min(
          config.packing.minAngularSeparation, // Preferred spacing
          maxAngularStep // Maximum allowed to stay in wedge
        );
        
        const startAngle = wedge.min + edgePadding;
        const angle = (startAngle + (positionInRing * angularStep)) * (Math.PI / 180);
        
        // Double-check: clamp angle to never exceed wedge boundaries
        const minAngleRad = (wedge.min + edgePadding) * (Math.PI / 180);
        const maxAngleRad = (wedge.max - edgePadding) * (Math.PI / 180);
        const clampedAngle = Math.max(minAngleRad, Math.min(maxAngleRad, angle));
        
        const x = anchor.x + Math.cos(clampedAngle) * radius;
        const y = anchor.y + Math.sin(clampedAngle) * radius;
        
        positionMap.set(node.id, {
          x, y, angle: clampedAngle * (180 / Math.PI), ring: ringIndex, 
          orbit: isVerb ? 'verbs' : 'nouns',
          parent: parent.type
        });
      });
    });
    
    return positionMap;
  }, [ORBITAL_CONFIG, getNodeRadius, shouldUseOrbitalPositioning, buildParentChildMap]);

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

    // Stage 0: Log metrics
    logGraphMetrics(data.nodes);

    const svg = d3.select(svgRef.current);

    if (simulation) {
      simulation.stop();
    }

    svg.selectAll('*').remove(); // Clear previous contents

    // Create a group that will be zoomable
    const zoomLayer = svg.append('g');

    const { width, height } = containerRef.current.getBoundingClientRect();

    // Stage 0: Set up zoom with persistence
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5]) // Set zoom limits
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform);
        lastTransform.current = event.transform; // Persist transform
      });

    svg.call(zoom);
    
    // Stage 0: Restore previous zoom if it exists
    if (lastTransform.current) {
      svg.call(zoom.transform, lastTransform.current);
    }

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

    // Stage 2: Conditional orbital positioning setup
    const orbitalPositions = computeOrbitalPositions(data, width, height);
    const useOrbital = orbitalPositions.size > 0;
    
    if (useOrbital) {
      console.log('🌌 Using orbital positioning for', orbitalPositions.size, 'nodes');
      
      // Apply orbital positions to nodes
      data.nodes.forEach(node => {
        const orbitalPos = orbitalPositions.get(node.id);
        if (orbitalPos) {
          node.fx = orbitalPos.x; // Fix positions
          node.fy = orbitalPos.y;
          node.orbitalData = orbitalPos; // Store metadata
        }
      });
    } else {
      // Clear any fixed positions for force simulation
      data.nodes.forEach(node => {
        node.fx = null;
        node.fy = null;
        node.orbitalData = null;
      });
    }

    // Set up the force simulation with conditional behavior
    const newSimulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links)
        .id(d => d.id)
        .distance(useOrbital ? 30 : 50) // Shorter links in orbital mode
      )
      .force('charge', d3.forceManyBody()
        .strength(d => {
          if (useOrbital && d.fx !== null) return 0; // No charge for fixed orbital nodes
          return d.type === 'word' ? -350 * sizeScale(d.dataSize) : -100;
        })
      )
      .force('center', useOrbital ? null : d3.forceCenter(width / 2, height / 2))
      .force('x', useOrbital ? null : d3.forceX(d => {
        if (d.type === 'corpusitem') return width / 2;
        if (d.type === 'form') return width / 4;
        if (d.type === 'root') return (3 * width) / 4;;
        if (d.type === 'word') return width / 2;
        return width / 2;
      }).strength(1))
      .force('y', useOrbital ? null : d3.forceY(d => {
        if (d.type === 'corpusitem') return height / 9; // Shift up
        if (d.type === 'form' || d.type === 'root') return height / 3; // Shift up
        if (d.type === 'word') return height / 2; // Shift up
        return height / 3; // Default to a higher position
      }).strength(1))
      .force('collide', d3.forceCollide(d => {
        if (d.type === 'word') {
          // Much larger collision radius for word nodes to account for labels
          return sizeScale(d.dataSize) + 35; // Increased from 20 to 35
        }
        return 70; // Increased collision space for anchor nodes too
      }))
      .alphaDecay(useOrbital ? 0.05 : 0.02) // Gentler settling in orbital mode
      .velocityDecay(useOrbital ? 0.9 : 0.992); // Even stronger damping for smoother movement

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

    // Stage 1: Append nodes with enhanced hit areas
    const nodeGroup = zoomLayer.append('g').attr('class', 'nodes');
    
    const nodeElements = nodeGroup.selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'node-group');

    // Visual node circles
    const node = nodeElements.append('circle')
      .attr('class', 'visual-node')
      .attr('r', d => {
        if (d.type === 'word') {
          if (d.dataSize === 0) return 1;
          return sizeScale(d.dataSize);
        }
        return 10;
      })
      .attr('fill', d => getColor(d));

    // Stage 1: Invisible hit area circles for small nodes
    const hitArea = nodeElements.append('circle')
      .attr('class', 'hit-area')
      .attr('r', d => {
        const visualRadius = d.type === 'word' ? 
          (d.dataSize === 0 ? 1 : sizeScale(d.dataSize)) : 10;
        return Math.max(visualRadius, 16); // Minimum 16px hit radius
      })
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .style('cursor', 'pointer');

    // Apply interactions to hit areas
    hitArea
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', handleNodeClick);

    // Add tooltips to visual nodes
    node.append('title').text(d => d.label);

    // Stage 1: Advanced label rendering with anchors, separation, and adaptive visibility
    const labelGroup = zoomLayer.append('g').attr('class', 'labels');
    
    // Compute label anchors for all nodes
    const labelAnchors = data.nodes.map(node => ({
      node: node,
      ...computeLabelAnchor(node, width, height)
    }));
    
    // Apply one-shot separation to avoid overlaps
    const separatedAnchors = separateLabels(labelAnchors);
    
    // Create label elements with white halos
    const labelElements = labelGroup.selectAll('g')
      .data(separatedAnchors)
      .enter().append('g')
      .attr('class', 'label-group');
      
    // Stage 1: White halo background
    const labelHalo = labelElements.append('text')
      .attr('class', 'label-halo')
      .text(d => d.node.label)
      .style('font-family', 'Noto Sans, sans-serif')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .style('fill', 'white')
      .style('stroke', 'white')
      .style('stroke-width', '3px')
      .style('stroke-linejoin', 'round')
      .style('pointer-events', 'none')
      .style('user-select', 'none');
      
    // Foreground label text
    const labelText = labelElements.append('text')
      .attr('class', 'label-text')
      .text(d => d.node.label)
      .style('font-family', 'Noto Sans, sans-serif')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'central')
      .style('fill', '#333')
      .style('pointer-events', 'auto')
      .style('cursor', 'pointer')
      .style('user-select', 'none')
      .on('click', (event, d) => handleNodeClick(event, d.node));

    newSimulation.nodes(data.nodes).on('tick', () => {
      // Find the minimum Y value (the highest node)
      const minY = d3.min(data.nodes, d => d.y);
      const topOffset = height / 7;
      const shiftY = topOffset - minY;

      // Update node group positions
      nodeElements.attr('transform', d => `translate(${d.x}, ${d.y + shiftY})`);

      // Stage 1: Update label positions with current zoom level for adaptive visibility
      const currentTransform = d3.zoomTransform(svg.node());
      const zoomScale = currentTransform.k;
      
      labelElements.attr('transform', (d, i) => {
        // Recompute label anchor based on current node position
        const nodeData = d.node;
        const anchor = computeLabelAnchor(nodeData, width, height);
        return `translate(${anchor.x}, ${anchor.y + shiftY})`;
      });
      
      // Stage 1: Adaptive visibility based on zoom level
      const labelVisibility = zoomScale < 0.6 ? 0 : 
                             zoomScale < 0.7 ? (zoomScale - 0.6) / 0.1 * 0.3 :
                             zoomScale < 0.9 ? 0.3 + (zoomScale - 0.7) / 0.2 * 0.7 : 1;
      
      labelHalo.style('opacity', labelVisibility);
      labelText.style('opacity', labelVisibility);

      // Update link positions
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
  }, [data, handleNodeClick, showLinks, showLinkLabels, wordShadeMode, logGraphMetrics, computeLabelAnchor, separateLabels, computeOrbitalPositions, buildParentChildMap, getNodeRadius, shouldUseOrbitalPositioning]); // Note: 'simulation' excluded to prevent infinite re-renders

  return (
    <div ref={containerRef} style={{ width: '90%', height: '90vh', maxHeight: '100%', maxWidth: '100%', position: 'relative' }}>
      {/* Stage 2: Temporary orbital mode toggle for testing */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 1001,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={enableOrbitalMode} 
            onChange={(e) => setEnableOrbitalMode(e.target.checked)}
          />
          🌌 Orbital Mode (Stage 2)
        </label>
      </div>
      
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