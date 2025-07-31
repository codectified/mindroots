import React, { createContext, useState, useContext } from 'react';

const FormFilterContext = createContext();

export const FormFilterProvider = ({ children }) => {
  // Initialize with all possible classifications to prevent filtering out nodes during initial load
  const [selectedFormClassifications, setSelectedFormClassifications] = useState(['ontological', 'Grammatical', 'Morphological']);

  return (
    <FormFilterContext.Provider value={{
      selectedFormClassifications,
      setSelectedFormClassifications
    }}>
      {children}
    </FormFilterContext.Provider>
  );
};

export const useFormFilter = () => {
  const context = useContext(FormFilterContext);
  if (!context) {
    throw new Error('useFormFilter must be used within a FormFilterProvider');
  }
  return context;
};