import React, { useState } from 'react';
import { getNodeColor } from '../utils/nodeColoring';
import InfoBubble from '../layout/InfoBubble';
import { useLanguage } from '../../contexts/LanguageContext';

const NodesTable = ({ graphData, wordShadeMode, onNodeClick, infoBubble, closeInfoBubble }) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  const { L1, L2 } = useLanguage();

  // Collect root nodes for top-level rows
  const rootNodes = graphData.nodes.filter((n) => n.type === 'root');

  const handleRootRowClick = (root, event) => {
    onNodeClick(root, event);
    setExpandedNodes((prev) => ({
      ...prev,
      [root.id]: !prev[root.id],
    }));
  };

  const handleWordRowClick = (word, event) => {
    onNodeClick(word, event);
  };

  const getChildWords = (root) => {
    return graphData.nodes
      .filter((n) => n.type === 'word' && n.root_id === root.root_id)
      .sort((a, b) => (b.dataSize || 0) - (a.dataSize || 0)); // Sort by dataSize descending
  };

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Arabic</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>English</th>
          </tr>
        </thead>
        <tbody>
          {rootNodes.map((root) => {
            const isExpanded = expandedNodes[root.id];
            const color = getNodeColor(root, wordShadeMode);

            return (
              <React.Fragment key={root.id}>
                {/* Root row */}
                <tr
                  onClick={(e) => handleRootRowClick(root, e)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #eee', color }}
                >
                  <td style={{ padding: '8px' }}>{L2 === 'off' ? (root[L1] ?? `(no ${L1})`) : `${root[L1] ?? `(no ${L1})`} / ${root[L2] ?? `(no ${L2})`}`}</td>
                  <td style={{ padding: '8px' }}>{/* Second column removed for cleaner layout */}</td>
                </tr>

                {/* Child word rows (only if expanded) */}
                {isExpanded &&
                  getChildWords(root).map((word) => {
                    const wordColor = getNodeColor(word, wordShadeMode);
                    return (
                      <tr
                        key={word.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent root row click
                          handleWordRowClick(word, e);
                        }}
                        style={{
                          background: '#f9f9f9',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          color: wordColor,
                        }}
                      >
                        <td style={{ padding: '8px 8px 8px 40px' }}>{L2 === 'off' ? (word[L1] ?? `(no ${L1})`) : `${word[L1] ?? `(no ${L1})`} / ${word[L2] ?? `(no ${L2})`}`}</td>
                        <td style={{ padding: '8px' }}>{/* Second column removed for cleaner layout */}</td>
                      </tr>
                    );
                  })}
              </React.Fragment>
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