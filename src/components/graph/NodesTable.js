import React, { useState } from 'react';
import { getNodeColor } from '../utils/nodeColoring';
import InfoBubble from '../layout/InfoBubble';
import { useFilter } from '../../contexts/FilterContext';
import { useFormFilter } from '../../contexts/FormFilterContext';

const NodesTable = ({ graphData, wordShadeMode, onNodeClick, infoBubble, closeInfoBubble }) => {
  const [expandedRoots, setExpandedRoots] = useState({});
  const [expandedForms, setExpandedForms] = useState({});
  const { hideFormNodes } = useFilter();
  const { selectedFormClassifications } = useFormFilter();

  // Collect root nodes
  const rootNodes = graphData.nodes.filter((n) => n.type === 'root');

  // Collect form nodes (filtered by classification)
  const formNodes = graphData.nodes.filter((n) => {
    if (n.type !== 'form') return false;
    if (hideFormNodes) return false;
    if (selectedFormClassifications.length === 0) return true; // Show all if none selected
    return selectedFormClassifications.includes(n.classification);
  });

  const handleRootRowClick = (root, event) => {
    onNodeClick(root, event);
    setExpandedRoots((prev) => ({
      ...prev,
      [root.id]: !prev[root.id],
    }));
  };

  const handleFormRowClick = (form, event) => {
    onNodeClick(form, event);
    setExpandedForms((prev) => ({
      ...prev,
      [form.id]: !prev[form.id],
    }));
  };

  const handleWordRowClick = (word, event) => {
    onNodeClick(word, event);
  };

  const getWordsForRoot = (root) => {
    return graphData.nodes
      .filter((n) => n.type === 'word' && n.root_id === root.root_id)
      .sort((a, b) => (b.dataSize || 0) - (a.dataSize || 0));
  };

  const getWordsForForm = (form) => {
    return graphData.nodes
      .filter((n) => n.type === 'word' && n.form_id === form.form_id)
      .sort((a, b) => (b.dataSize || 0) - (a.dataSize || 0));
  };

  return (
    <>
      {/* SECTION 1: ROOTS TABLE */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Roots</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Arabic</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>English</th>
            </tr>
          </thead>
          <tbody>
            {rootNodes.map((root) => {
              const isExpanded = expandedRoots[root.id];
              const color = getNodeColor(root, wordShadeMode);

              return (
                <React.Fragment key={`root-${root.id}`}>
                  {/* Root row */}
                  <tr
                    onClick={(e) => handleRootRowClick(root, e)}
                    style={{ 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #eee', 
                      color
                    }}
                  >
                    <td style={{ padding: '8px' }}>{root.arabic ?? '(no Arabic)'}</td>
                    <td style={{ padding: '8px' }}>{root.english ?? '(no English)'}</td>
                  </tr>

                  {/* Expanded word rows */}
                  {isExpanded &&
                    getWordsForRoot(root).map((word) => {
                      const wordColor = getNodeColor(word, wordShadeMode);
                      return (
                        <tr
                          key={`root-${root.id}-word-${word.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
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
      </div>

      {/* SECTION 2: FORMS TABLE */}
      {formNodes.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Forms</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Arabic</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>English</th>
              </tr>
            </thead>
            <tbody>
              {formNodes.map((form) => {
                const isExpanded = expandedForms[form.id];
                const color = getNodeColor(form, wordShadeMode);

                return (
                  <React.Fragment key={`form-${form.id}`}>
                    {/* Form row */}
                    <tr
                      onClick={(e) => handleFormRowClick(form, e)}
                      style={{ 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #eee', 
                        color: '#1976d2' // Blue text to distinguish forms
                      }}
                    >
                      <td style={{ padding: '8px' }}>{form.arabic ?? '(no Arabic)'}</td>
                      <td style={{ padding: '8px' }}>{form.english ?? '(no English)'}</td>
                    </tr>

                    {/* Expanded word rows */}
                    {isExpanded &&
                      getWordsForForm(form).map((word) => {
                        const wordColor = getNodeColor(word, wordShadeMode);
                        return (
                          <tr
                            key={`form-${form.id}-word-${word.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
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
        </div>
      )}

      {/* InfoBubble */}
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