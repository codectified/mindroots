import React, { useState } from 'react';
import { getNodeColor } from '../utils/nodeColoring';
import InfoBubble from '../layout/InfoBubble';
import { useLanguage } from '../../contexts/LanguageContext';

const NodesTable = ({ graphData, wordShadeMode, onNodeClick, infoBubble, closeInfoBubble }) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  const { L1, L2 } = useLanguage();

  // Collect all nodes that have semantic or text properties to display
  const displayableNodes = graphData.nodes.filter((n) => 
    n.sem || n.arabic || n.english
  ).sort((a, b) => {
    // Sort by type priority: corpusitem first, then root, then word, then others
    const typeOrder = { corpusitem: 0, root: 1, word: 2 };
    const aOrder = typeOrder[a.type] ?? 3;
    const bOrder = typeOrder[b.type] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Secondary sort by dataSize or id
    return (b.dataSize || 0) - (a.dataSize || 0) || (a.id - b.id);
  });

  const handleNodeRowClick = (node, event) => {
    onNodeClick(node, event);
  };

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
          {displayableNodes.map((node) => {
            const color = getNodeColor(node, wordShadeMode);
            const nodeTypeStyle = {
              corpusitem: { background: '#f0f8ff' },
              root: { background: '#fff' },
              word: { background: '#f9f9f9' },
            };

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
                <td style={{ padding: '8px' }}>{node.sem ?? node.arabic ?? '(no semantic)'}</td>
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
          definition={infoBubble.definition}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
          }}
        />
      )}
    </>
  );
};

export default NodesTable;