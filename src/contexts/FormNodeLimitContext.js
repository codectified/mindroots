import React, { createContext, useState, useContext } from 'react';

const FormNodeLimitContext = createContext();

export const FormNodeLimitProvider = ({ children }) => {
  const [formNodeLimit, setFormNodeLimit] = useState(25); // Default limit for form node expansions

  return (
    <FormNodeLimitContext.Provider value={{ 
      formNodeLimit, 
      setFormNodeLimit 
    }}>
      {children}
    </FormNodeLimitContext.Provider>
  );
};

export const useFormNodeLimit = () => {
  const context = useContext(FormNodeLimitContext);
  if (!context) {
    throw new Error('useFormNodeLimit must be used within FormNodeLimitProvider');
  }
  return context;
};