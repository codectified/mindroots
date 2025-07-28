import React, { useState, useEffect } from 'react';
import { useFormFilter } from '../../contexts/FormFilterContext';
import { useGraphData } from '../../contexts/GraphDataContext';

const FormClassificationFilter = () => {
  const { selectedFormClassifications, setSelectedFormClassifications } = useFormFilter();
  const { graphData } = useGraphData();
  const [availableClassifications, setAvailableClassifications] = useState([]);

  // Extract unique form classifications from current graph data
  useEffect(() => {
    const formNodes = graphData.nodes.filter(node => node.type === 'form');
    const classifications = [...new Set(
      formNodes
        .map(node => node.classification)
        .filter(classification => classification && classification.trim() !== '')
    )].sort();
    
    setAvailableClassifications(classifications);
    
    // If no selections made yet, default to all available
    if (selectedFormClassifications.length === 0 && classifications.length > 0) {
      setSelectedFormClassifications(classifications);
    }
  }, [graphData.nodes, selectedFormClassifications.length, setSelectedFormClassifications]);

  const handleClassificationToggle = (classification) => {
    if (selectedFormClassifications.includes(classification)) {
      setSelectedFormClassifications(prev => prev.filter(c => c !== classification));
    } else {
      setSelectedFormClassifications(prev => [...prev, classification]);
    }
  };

  if (availableClassifications.length === 0) {
    return null; // Don't show the filter if no form classifications are available
  }

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
        Form Classifications
      </label>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {availableClassifications.map(classification => (
          <label
            key={classification}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '2px 0'
            }}
          >
            <input
              type="checkbox"
              checked={selectedFormClassifications.includes(classification)}
              onChange={() => handleClassificationToggle(classification)}
              style={{ 
                marginRight: '8px',
                accentColor: '#007bff' // Blue checkmark
              }}
            />
            <span>{classification}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default FormClassificationFilter;