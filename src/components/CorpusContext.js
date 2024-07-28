// src/components/CorpusContext.js

import React, { createContext, useContext, useState } from 'react';

const CorpusContext = createContext();

export const useCorpus = () => {
  return useContext(CorpusContext);
};

export const CorpusProvider = ({ children }) => {
  const [selectedCorpus, setSelectedCorpus] = useState(null);

  return (
    <CorpusContext.Provider value={{ selectedCorpus, setSelectedCorpus }}>
      {children}
    </CorpusContext.Provider>
  );
};
