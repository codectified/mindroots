// ../contexts/FilterContext.js
import React, { createContext, useState, useContext } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filterWordTypes, setFilterWordTypes] = useState([]); // Multi-select filter for word types
  const [hideFormNodes, setHideFormNodes] = useState(true); // New state to hide form nodes

  const toggleWordType = (type) => {
    setFilterWordTypes((prevTypes) => 
      prevTypes.includes(type) 
        ? prevTypes.filter(t => t !== type) // Remove type if it's already selected
        : [...prevTypes, type] // Add type if it's not selected
    );
  };

  const toggleHideFormNodes = () => setHideFormNodes(prev => !prev); // Toggle form node visibility

  return (
    <FilterContext.Provider value={{ filterWordTypes, toggleWordType, hideFormNodes, toggleHideFormNodes }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);