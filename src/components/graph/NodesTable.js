import React, { useCallback } from 'react';
import { getNodeColor } from '../utils/nodeColoring';
import InfoBubble from '../layout/InfoBubble';
import NodeContextMenu from './NodeContextMenu';
import NodeInspector from './NodeInspector';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';
import { useGraphData } from '../../contexts/GraphDataContext';

const NodesTable = ({ graphData, wordShadeMode, onNodeClick, infoBubble, closeInfoBubble }) => {
  const { isAdvancedMode } = useAdvancedMode();
  const { contextMenu, setContextMenu, handleContextMenuAction, nodeInspectorData, setNodeInspectorData } = useGraphData();

  // Collect all nodes that have semantic or text properties to display
  const displayableNodes = graphData.nodes.filter((n) => 
    n.sem || n.arabic || n.english
  );

  // Create hierarchical sorting for table mode - group words under their parent roots
  const createHierarchicalSort = (nodes, links) => {
    // Build parent-child relationships from links
    const childrenMap = new Map(); // parentId -> [children]
    const parentMap = new Map();   // childId -> parentId
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      // For root->word relationships, root is parent, word is child
      if (link.type === 'HAS_WORD') {
        if (!childrenMap.has(sourceId)) childrenMap.set(sourceId, []);
        childrenMap.get(sourceId).push(targetId);
        parentMap.set(targetId, sourceId);
      }
    });
    
    // Create node lookup
    const nodeMap = new Map();
    nodes.forEach(node => nodeMap.set(node.id, node));
    
    // Separate root/corpusitem nodes from others
    const rootNodes = nodes.filter(n => n.type === 'root' || n.type === 'corpusitem');
    const otherNodes = nodes.filter(n => n.type !== 'root' && n.type !== 'corpusitem');
    
    // Sort root nodes
    const sortedRoots = rootNodes.sort((a, b) => {
      const typeOrder = { corpusitem: 0, root: 1 };
      const aOrder = typeOrder[a.type] ?? 2;
      const bOrder = typeOrder[b.type] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (b.dataSize || 0) - (a.dataSize || 0) || (a.id?.localeCompare(b.id) || 0);
    });
    
    // Build final hierarchical list
    const result = [];
    
    sortedRoots.forEach(rootNode => {
      result.push(rootNode);
      
      // Add children (words) directly under this root
      const childIds = childrenMap.get(rootNode.id) || [];
      const childNodes = childIds
        .map(id => nodeMap.get(id))
        .filter(Boolean)
        .sort((a, b) => (a.id?.localeCompare(b.id) || 0));
      
      result.push(...childNodes);
    });
    
    // Add any orphaned nodes (no parent relationship) at the end
    const processedIds = new Set(result.map(n => n.id));
    const orphans = otherNodes.filter(n => !processedIds.has(n.id));
    result.push(...orphans);
    
    return result;
  };

  const sortedNodes = createHierarchicalSort(displayableNodes, graphData.links);

  // Enhanced click handler that checks for advanced mode (matches GraphVisualization)
  const handleNodeRowClick = useCallback((node, event) => {
    if (isAdvancedMode) {
      // In advanced mode, show context menu
      const position = {
        x: event.pageX,
        y: event.pageY
      };
      setContextMenu({ node, position });
    } else {
      // In guided mode, use original behavior
      onNodeClick(node, event);
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

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Semantic</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>English</th>
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map((node, index) => {
            const color = getNodeColor(node, wordShadeMode);
            
            // Determine if this is a child node (word under a root)
            const prevNode = index > 0 ? sortedNodes[index - 1] : null;
            const isChildNode = node.type === 'word' && prevNode && (prevNode.type === 'root' || prevNode.type === 'corpusitem');
            const isChildAfterChild = node.type === 'word' && prevNode && prevNode.type === 'word';
            const actualChild = isChildNode || isChildAfterChild;
            
            const nodeTypeStyle = {
              corpusitem: { background: '#f0f8ff' },
              root: { background: '#fff' },
              word: { background: actualChild ? '#f5f5f5' : '#f9f9f9' },
            };

            const paddingLeft = actualChild ? '24px' : '8px'; // Indent child nodes

            return (
              <tr
                key={node.id}
                onClick={(e) => handleNodeRowClick(node, e)}
                style={{ 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #eee', 
                  color,
                  ...(nodeTypeStyle[node.type] || {})
                }}
              >
                <td style={{ padding: '8px', paddingLeft }}>{node.sem ?? node.arabic ?? '(no semantic)'}</td>
                <td style={{ padding: '8px' }}>{node.english ?? '(no english)'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Conditionally render the InfoBubble */}
      {infoBubble && (
        <InfoBubble
          className="info-bubble"
          nodeData={infoBubble.nodeData || { definitions: infoBubble.definition }}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
          }}
        />
      )}

      {/* Context menu for advanced mode */}
      {contextMenu && (
        <NodeContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onAction={handleMenuAction}
          onClose={handleCloseContextMenu}
        />
      )}

      {/* Node inspector */}
      {nodeInspectorData && (
        <NodeInspector
          nodeData={nodeInspectorData}
          onClose={handleCloseInspector}
        />
      )}
    </>
  );
};

export default NodesTable;