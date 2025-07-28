import React, { useState, useEffect, useRef } from 'react';
import { useFormFilter } from '../../contexts/FormFilterContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { useFilter } from '../../contexts/FilterContext';

const FormClassificationFilter = () => {
  const { selectedFormClassifications, setSelectedFormClassifications } = useFormFilter();
  const { graphData } = useGraphData();
  const { hideFormNodes } = useFilter();
  const [availableClassifications, setAvailableClassifications] = useState([]);
  const allSeenClassifications = useRef(new Set());

  // Extract unique form classifications from current graph data
  useEffect(() => {
    const formNodes = graphData.nodes.filter(node => node.type === 'form');
    const currentClassifications = formNodes
      .map(node => node.classification)
      .filter(classification => classification && classification.trim() !== '');
    
    // Add to our running set of all seen classifications
    currentClassifications.forEach(classification => {
      allSeenClassifications.current.add(classification);
    });
    
    // Use all seen classifications, not just current ones
    const classifications = [...allSeenClassifications.current].sort();
    setAvailableClassifications(classifications);
  }, [graphData.nodes]);

  // Separate effect for initializing selections
  useEffect(() => {
    if (selectedFormClassifications.length === 0 && availableClassifications.length > 0) {
      setSelectedFormClassifications(availableClassifications);
    }
  }, [availableClassifications, selectedFormClassifications.length, setSelectedFormClassifications]);

  const handleClassificationToggle = (classification) => {
    if (selectedFormClassifications.includes(classification)) {
      setSelectedFormClassifications(prev => prev.filter(c => c !== classification));
    } else {
      setSelectedFormClassifications(prev => [...prev, classification]);
    }
  };

  if (hideFormNodes || availableClassifications.length === 0) {
    return null; // Don't show the filter if form nodes are hidden or no form classifications are available
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
      <label>Form Classifications:</label>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {availableClassifications.map(classification => (
          <label key={classification} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={selectedFormClassifications.includes(classification)}
              onChange={() => handleClassificationToggle(classification)}
              style={{
                accentColor: '#007bff'
              }}
            />
            {classification}
          </label>
        ))}
      </div>
    </div>
  );
};

export default FormClassificationFilter;