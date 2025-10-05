// ../contexts/FilterContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAdvancedMode } from './AdvancedModeContext';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const { isAdvancedMode } = useAdvancedMode();
  
  // Initialize filter based on mode
  const getInitialFilters = (advancedMode) => {
    return advancedMode 
      ? ['phrase', 'verb', 'noun'] // Advanced mode: all types selected
      : ['verb']; // Guided mode: only verbs selected
  };

  const [filterWordTypes, setFilterWordTypes] = useState(() => getInitialFilters(isAdvancedMode));
  const [hideFormNodes, setHideFormNodes] = useState(false); // Form nodes shown by default in both modes

  // Update filters when mode changes
  useEffect(() => {
    const newFilters = getInitialFilters(isAdvancedMode);
    setFilterWordTypes(newFilters);
    console.log(`🎛️ Filter defaults updated for ${isAdvancedMode ? 'advanced' : 'guided'} mode:`, newFilters);
  }, [isAdvancedMode]);

  // Form nodes are always visible by default in both guided and advanced modes
  // The only difference is that advanced mode has context menu functionality

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