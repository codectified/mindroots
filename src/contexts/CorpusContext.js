import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchCorpora, fetchCorpusItems } from '../services/apiService';

const CorpusContext = createContext();

export const CorpusProvider = ({ children }) => {
  const [selectedCorpus, setSelectedCorpus] = useState(null);
  const [selectedCorpusItem, setSelectedCorpusItem] = useState(null);
  const [corpora, setCorpora] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [corpusItems, setCorpusItems] = useState([]);

  const handleSelectCorpus = async (corpus) => {
    setSelectedCorpus(corpus);
    const items = await fetchCorpusItems(corpus.id);
    setCorpusItems(items);
    setCurrentIndex(0); // Start with the first item
    setSelectedCorpusItem(items[0]); // Set the first item as selected
  };

  const handleSelectCorpusItem = (item) => {
    setSelectedCorpusItem(item);
  };

  const goToNextItem = () => {
    if (currentIndex !== null && currentIndex < corpusItems.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedCorpusItem(corpusItems[newIndex]);
    }
  };

  const goToPreviousItem = () => {
    if (currentIndex !== null && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedCorpusItem(corpusItems[newIndex]);
    }
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
        goToNextItem, 
        goToPreviousItem,
        handleSelectCorpusItem,
        corpora,
        corpusItems,
      }}>
      {children}
    </CorpusContext.Provider>
  );
};

export const useCorpus = () => useContext(CorpusContext);
