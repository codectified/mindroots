import React, { useState } from 'react';
import { getNodeColor } from '../utils/nodeColoring';
import InfoBubble from '../layout/InfoBubble';
import { useFilter } from '../../contexts/FilterContext';
import { useFormFilter } from '../../contexts/FormFilterContext';

const NodesTable = ({ graphData, wordShadeMode, onNodeClick, infoBubble, closeInfoBubble }) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  const { hideFormNodes } = useFilter();
  const { selectedFormClassifications } = useFormFilter();

  // Collect root nodes for top-level rows
  const rootNodes = graphData.nodes.filter((n) => n.type === 'root');

  // Collect form nodes for top-level rows (filtered by classification)
  const formNodes = graphData.nodes.filter((n) => {
    if (n.type !== 'form') return false;
    if (hideFormNodes) return false;
    if (selectedFormClassifications.length === 0) return true; // Show all if none selected
    return selectedFormClassifications.includes(n.classification);
  });

  const handleParentRowClick = (parentNode, event) => {
    onNodeClick(parentNode, event);
    setExpandedNodes((prev) => ({
      ...prev,
      [parentNode.id]: !prev[parentNode.id],
    }));
  };

  const handleWordRowClick = (word, event) => {
    onNodeClick(word, event);
  };

  const getChildWords = (parentNode) => {
    let childWords = [];
    
    if (parentNode.type === 'root') {
      childWords = graphData.nodes
        .filter((n) => n.type === 'word' && n.root_id === parentNode.root_id);
    } else if (parentNode.type === 'form') {
      childWords = graphData.nodes
        .filter((n) => n.type === 'word' && n.form_id === parentNode.form_id);
    }
    
    return childWords.sort((a, b) => (b.dataSize || 0) - (a.dataSize || 0)); // Sort by dataSize descending
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
          {/* Render root nodes */}
          {rootNodes.map((root) => {
            const isExpanded = expandedNodes[root.id];
            const color = getNodeColor(root, wordShadeMode);

            return (
              <React.Fragment key={`root-${root.id}`}>
                {/* Root row */}
                <tr
                  onClick={(e) => handleParentRowClick(root, e)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #eee', color, fontWeight: 'bold' }}
                >
                  <td style={{ padding: '8px' }}>{root.arabic ?? '(no Arabic)'}</td>
                  <td style={{ padding: '8px' }}>{root.english ?? '(no English)'}</td>
                </tr>

                {/* Child word rows (only if expanded) */}
                {isExpanded &&
                  getChildWords(root).map((word) => {
                    const wordColor = getNodeColor(word, wordShadeMode);
                    return (
                      <tr
                        key={`root-${root.id}-word-${word.id}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent parent row click
                          handleWordRowClick(word, e);
                        }}
                        style={{
                          background: '#f9f9f9',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          color: wordColor,
                        }}
                      >
                        <td style={{ padding: '8px 8px 8px 40px' }}>{word.arabic ?? '(no Arabic)'}</td>
                        <td style={{ padding: '8px' }}>{word.english ?? '(no English)'}</td>
                      </tr>
                    );
                  })}
              </React.Fragment>
            );
          })}

          {/* Render form nodes */}
          {formNodes.map((form) => {
            const isExpanded = expandedNodes[form.id];
            const color = getNodeColor(form, wordShadeMode);

            return (
              <React.Fragment key={`form-${form.id}`}>
                {/* Form row */}
                <tr
                  onClick={(e) => handleParentRowClick(form, e)}
                  style={{ 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #eee', 
                    color, 
                    fontStyle: 'italic',
                    backgroundColor: '#f0f8ff' // Light blue background to distinguish forms
                  }}
                >
                  <td style={{ padding: '8px' }}>{form.arabic ?? '(no Arabic)'}</td>
                  <td style={{ padding: '8px' }}>{form.english ?? '(no English)'}</td>
                </tr>

                {/* Child word rows (only if expanded) */}
                {isExpanded &&
                  getChildWords(form).map((word) => {
                    const wordColor = getNodeColor(word, wordShadeMode);
                    return (
                      <tr
                        key={`form-${form.id}-word-${word.id}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent parent row click
                          handleWordRowClick(word, e);
                        }}
                        style={{
                          background: '#f9f9f9',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          color: wordColor,
                        }}
                      >
                        <td style={{ padding: '8px 8px 8px 40px' }}>{word.arabic ?? '(no Arabic)'}</td>
                        <td style={{ padding: '8px' }}>{word.english ?? '(no English)'}</td>
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