// ../contexts/FilterContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAdvancedMode } from './AdvancedModeContext';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const { isAdvancedMode } = useAdvancedMode();
  
  // Default word types selected
  const [filterWordTypes, setFilterWordTypes] = useState([
    'phrase', 'verb', 'noun', 'unclassified',
  ]); // All selected by default
  const [hideFormNodes, setHideFormNodes] = useState(!isAdvancedMode); // Form nodes shown by default in advanced mode

  // Update form nodes visibility when advanced mode changes
  useEffect(() => {
    setHideFormNodes(!isAdvancedMode);
  }, [isAdvancedMode]);

  const toggleWordType = (type) => {
    setFilterWordTypes((prevTypes) =>
      prevTypes.includes(type)
        ? prevTypes.filter((t) => t !== type) // Remove type if selected
        : [...prevTypes, type] // Add type if not selected
    );
  };

  const toggleHideFormNodes = () => setHideFormNodes((prev) => !prev); // Toggle form node visibility

  return (
    <FilterContext.Provider value={{ filterWordTypes, toggleWordType, hideFormNodes, toggleHideFormNodes }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);