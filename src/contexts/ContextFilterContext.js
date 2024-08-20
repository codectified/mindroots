import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCorpus } from './CorpusContext';

const ContextFilterContext = createContext();

export const ContextFilterProvider = ({ children }) => {
  const { selectedCorpus } = useCorpus();
  const [contextFilterRoot, setContextFilterRoot] = useState('lexicon');
  const [contextFilterForm, setContextFilterForm] = useState('lexicon');

  useEffect(() => {
    if (selectedCorpus) {
      setContextFilterForm(selectedCorpus.id);
    }
  }, [selectedCorpus]);

  return (
    <ContextFilterContext.Provider 
      value={{ 
        contextFilterRoot, 
        setContextFilterRoot, 
        contextFilterForm, 
        setContextFilterForm 
      }}>
      {children}
    </ContextFilterContext.Provider>
  );
};

export const useContextFilter = () => useContext(ContextFilterContext);
