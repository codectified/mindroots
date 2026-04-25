import React, { useCallback } from 'react';
import { getNodeColor } from '../utils/nodeColoring';
import InfoBubble from '../layout/InfoBubble';
import NodeContextMenu from './NodeContextMenu';
import NodeInspector from './NodeInspector';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { useLabels } from '../../hooks/useLabels';

const NodesTable = ({ graphData, wordShadeMode, onNodeClick, infoBubble, closeInfoBubble }) => {
  const { isAdvancedMode } = useAdvancedMode();
  const t = useLabels();
  const { contextMenu, setContextMenu, handleContextMenuAction, nodeInspectorData, setNodeInspectorData, handleNodeNavigation } = useGraphData();

  // Collect all nodes that have semantic or text properties to display
  const displayableNodes = graphData.nodes.filter((n) => 
    n.sem || n.arabic || n.english
  );

  // Create hierarchical sorting for table mode - group words under their parent roots
  const createHierarchicalSort = (nodes, links) => {
    const childrenMap = new Map(); // parentId -> [childId]
    const childNodeIds = new Set(); // node IDs that are direct children via HAS_WORD

    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      if (link.type === 'HAS_WORD') {
        if (!childrenMap.has(sourceId)) childrenMap.set(sourceId, []);
        childrenMap.get(sourceId).push(targetId);
        childNodeIds.add(targetId);
      }
    });

    const nodeMap = new Map();
    nodes.forEach(node => nodeMap.set(node.id, node));

    const rootNodes = nodes.filter(n => n.type === 'root' || n.type === 'corpusitem');
    const otherNodes = nodes.filter(n => n.type !== 'root' && n.type !== 'corpusitem');

    const sortedRoots = rootNodes.sort((a, b) => {
      const typeOrder = { corpusitem: 0, root: 1 };
      const aOrder = typeOrder[a.type] ?? 2;
      const bOrder = typeOrder[b.type] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (b.dataSize || 0) - (a.dataSize || 0) || (a.id?.localeCompare(b.id) || 0);
    });

    const result = [];

    sortedRoots.forEach(rootNode => {
      result.push(rootNode);
      const childIds = childrenMap.get(rootNode.id) || [];
      const childNodes = childIds
        .map(id => nodeMap.get(id))
        .filter(Boolean)
        .sort((a, b) => (a.id?.localeCompare(b.id) || 0));
      result.push(...childNodes);
    });

    // Orphans: nodes with no parent relationship — rendered flat, no indent
    const processedIds = new Set(result.map(n => n.id));
    const orphans = otherNodes.filter(n => !processedIds.has(n.id));
    result.push(...orphans);

    return { nodes: result, childNodeIds };
  };

  const { nodes: sortedNodes, childNodeIds } = createHierarchicalSort(displayableNodes, graphData.links);

  const hasCorpusItems = sortedNodes.some(n => n.type === 'corpusitem');
  const hasCorpusCounts = sortedNodes.some(n => n.corpus_count != null);
  const showLocationColumn = hasCorpusItems || hasCorpusCounts;

  const formatLocation = (node) => {
    if (node.type === 'corpusitem') {
      if (node.surah_number != null && node.ayah_number != null) {
        const word = node.word_position != null ? `:${node.word_position}` : '';
        return `${node.surah_number}:${node.ayah_number}${word}`;
      }
      return node.item_id ?? null;
    }
    if (node.corpus_count != null && node.corpus_count > 0) {
      return `${node.corpus_count} ${node.corpus_count === 1 ? t.itemSingular : t.itemPlural}`;
    }
    return null;
  };

  // Enhanced click handler that checks for advanced mode (matches GraphVisualization)
  const handleNodeRowClick = useCallback((node, event) => {
    if (isAdvancedMode) {
      // In advanced mode, show context menu
      const position = {
        x: event.clientX,
        y: event.clientY
      };
      setContextMenu({ node, position });
    } else {
      // In guided mode, use original behavior
      onNodeClick(node, event);
    }
  }, [isAdvancedMode, onNodeClick, setContextMenu]);

  // Context menu action handler
  const handleMenuAction = useCallback((action, node) => {
    handleContextMenuAction(action, node, contextMenu?.position);
  }, [handleContextMenuAction, contextMenu]);

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
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#ccc]">
            <th className="p-2 text-left">{t.colSemantic}</th>
            <th className="p-2 text-left">{t.colEnglish}</th>
            {showLocationColumn && (
              <th className="p-2 text-left whitespace-nowrap text-[13px] text-[#555]">{t.colLocation}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map((node) => {
            const color = getNodeColor(node, wordShadeMode);
            const actualChild = childNodeIds.has(node.id);

            // background is runtime-computed per node type — stays inline
            const nodeTypeBg = {
              corpusitem: '#f0f8ff',
              root: '#fff',
              word: actualChild ? '#f5f5f5' : '#f9f9f9',
            };

            const location = formatLocation(node);

            return (
              <tr
                key={node.id}
                onClick={(e) => handleNodeRowClick(node, e)}
                className="cursor-pointer border-b border-[#eee]"
                style={{ color, background: nodeTypeBg[node.type] }}
              >
                <td className={`p-2 ${actualChild ? 'pl-6' : ''} ${node.sem != null || node.arabic != null ? 'arabic' : ''}`}>{node.sem ?? node.arabic ?? t.noSemantic}</td>
                <td className="p-2">{node.english ?? t.noEnglish}</td>
                {showLocationColumn && (
                  <td className="p-2 text-[12px] text-muted whitespace-nowrap font-mono">
                    {location ?? ''}
                  </td>
                )}
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
          onNavigate={handleNodeNavigation}
        />
      )}
    </>
  );
};

export default NodesTable;