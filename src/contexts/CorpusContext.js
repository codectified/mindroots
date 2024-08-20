import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchCorpora } from '../services/apiService';

const CorpusContext = createContext();

export const CorpusProvider = ({ children }) => {
  const [selectedCorpus, setSelectedCorpus] = useState(null);
  const [selectedCorpusItem, setSelectedCorpusItem] = useState(null);
  const [corpora, setCorpora] = useState([]);

  const handleSelectCorpus = (corpus) => {
    setSelectedCorpus(corpus);
  };

  const handleSelectCorpusItem = (item) => {
    setSelectedCorpusItem(item);
  };

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

  return (
    <CorpusContext.Provider 
      value={{ 
        selectedCorpus, 
        handleSelectCorpus, 
        selectedCorpusItem, 
        handleSelectCorpusItem,
        corpora,
      }}>
      {children}
    </CorpusContext.Provider>
  );
};

export const useCorpus = () => useContext(CorpusContext);
