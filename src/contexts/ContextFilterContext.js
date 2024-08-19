import React, { createContext, useState, useContext } from 'react';

const ContextFilterContext = createContext();

export const ContextFilterProvider = ({ children }) => {
  const [contextFilterRoot, setContextFilterRoot] = useState('lexicon');
  const [contextFilterForm, setContextFilterForm] = useState('corpus');

  return (
    <ContextFilterContext.Provider value={{ contextFilterRoot, setContextFilterRoot, contextFilterForm, setContextFilterForm }}>
      {children}
    </ContextFilterContext.Provider>
  );
};

export const useContextFilter = () => useContext(ContextFilterContext);
