import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchCorpora } from '../services/apiService';

const CorpusContext = createContext();

export const CorpusProvider = ({ children }) => {
  const [selectedCorpus, setSelectedCorpus] = useState(null);
  const [corpora, setCorpora] = useState([]);

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const data = await fetchCorpora();
        setCorpora(data);
      } catch (error) {
        console.error('Error fetching corpora:', error);
      }
    };
    fetchCorporaData();
  }, []);

  const handleSelectCorpus = (corpus) => {
    setSelectedCorpus(corpus);
  };

  return (
    <CorpusContext.Provider value={{ selectedCorpus, setSelectedCorpus, corpora, setCorpora, handleSelectCorpus }}>
      {children}
    </CorpusContext.Provider>
  );
};

export const useCorpus = () => useContext(CorpusContext);
