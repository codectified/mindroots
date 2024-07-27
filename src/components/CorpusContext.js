import React, { createContext, useState, useContext } from 'react';

const CorpusContext = createContext();

export const CorpusProvider = ({ children }) => {
  const [selectedCorpus, setSelectedCorpus] = useState(null);

  return (
    <CorpusContext.Provider value={{ selectedCorpus, setSelectedCorpus }}>
      {children}
    </CorpusContext.Provider>
  );
};

export const useCorpus = () => {
  const context = useContext(CorpusContext);
  if (!context) {
    throw new Error('useCorpus must be used within a CorpusProvider');
  }
  return context;
};
