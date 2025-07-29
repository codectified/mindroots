import React, { createContext, useState, useContext } from 'react';

const FormFilterContext = createContext();

export const FormFilterProvider = ({ children }) => {
  const [selectedFormClassifications, setSelectedFormClassifications] = useState([]); // Empty means all selected

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