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

  useEffect(() => {
    const formNodes = graphData.nodes.filter(node => node.type === 'form');
    const currentClassifications = formNodes
      .map(node => node.classification)
      .filter(classification => classification && classification.trim() !== '');
    currentClassifications.forEach(classification => {
      allSeenClassifications.current.add(classification);
    });
    setAvailableClassifications([...allSeenClassifications.current].sort());
  }, [graphData.nodes]);

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

  if (hideFormNodes || availableClassifications.length === 0) return null;

  return (
    <div className="flex flex-col gap-[10px] py-[10px]">
      <label>Form Classifications:</label>
      <div className="flex gap-[15px] flex-wrap">
        {availableClassifications.map(classification => (
          <label key={classification} className="flex items-center gap-[5px]">
            <input
              type="checkbox"
              checked={selectedFormClassifications.includes(classification)}
              onChange={() => handleClassificationToggle(classification)}
              style={{ accentColor: '#007bff' }}
            />
            {classification}
          </label>
        ))}
      </div>
    </div>
  );
};

export default FormClassificationFilter;
