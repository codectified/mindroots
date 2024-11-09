// ../contexts/FilterContext.js
import React, { createContext, useState, useContext } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  // Ensure filterWordTypes defaults to an empty array
  const [filterWordTypes, setFilterWordTypes] = useState([]); // e.g., ['noun', 'verb']

  const toggleWordType = (type) => {
    setFilterWordTypes((prevTypes) => 
      prevTypes.includes(type) 
        ? prevTypes.filter(t => t !== type) // Remove type if it's already selected
        : [...prevTypes, type] // Add type if it's not selected
    );
  };

  return (
    <FilterContext.Provider value={{ filterWordTypes, toggleWordType }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);