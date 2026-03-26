import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCorpus } from './CorpusContext';

const CorpusFilterContext = createContext();

export const CorpusFilterProvider = ({ children }) => {
  const { selectedCorpus } = useCorpus();
  const [corpusFilter, setCorpusFilter] = useState('lexicon');

  useEffect(() => {
    if (selectedCorpus) {
      setCorpusFilter(selectedCorpus.id);
    }
  }, [selectedCorpus]);

  return (
    <CorpusFilterContext.Provider value={{ corpusFilter, setCorpusFilter }}>
      {children}
    </CorpusFilterContext.Provider>
  );
};

export const useCorpusFilter = () => useContext(CorpusFilterContext);
