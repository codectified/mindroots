import React, { useState, useEffect } from 'react';
import { useFormFilter } from '../../contexts/FormFilterContext';
import { useGraphData } from '../../contexts/GraphDataContext';

const FormClassificationFilter = () => {
  const { selectedFormClassifications, setSelectedFormClassifications } = useFormFilter();
  const { graphData } = useGraphData();
  const [availableClassifications, setAvailableClassifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const handleSelectAll = () => {
    setSelectedFormClassifications(availableClassifications);
  };

  const handleSelectNone = () => {
    setSelectedFormClassifications([]);
  };

  if (availableClassifications.length === 0) {
    return null; // Don't show the filter if no form classifications are available
  }

  return (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
        Form Classifications
      </label>
      
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '12px'
          }}
        >
          {selectedFormClassifications.length === 0 
            ? 'None selected' 
            : selectedFormClassifications.length === availableClassifications.length
            ? 'All selected'
            : `${selectedFormClassifications.length} selected`
          } ▼
        </button>

        {isDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {/* Select All/None controls */}
            <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <button
                onClick={handleSelectAll}
                style={{
                  marginRight: '8px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                All
              </button>
              <button
                onClick={handleSelectNone}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                None
              </button>
            </div>

            {/* Classification checkboxes */}
            {availableClassifications.map(classification => (
              <label
                key={classification}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => handleClassificationToggle(classification)}
              >
                <input
                  type="checkbox"
                  checked={selectedFormClassifications.includes(classification)}
                  onChange={() => handleClassificationToggle(classification)}
                  style={{ marginRight: '8px' }}
                />
                {classification}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default FormClassificationFilter;