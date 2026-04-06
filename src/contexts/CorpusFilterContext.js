import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCorpus } from './CorpusContext';

const CorpusFilterContext = createContext();

export const CorpusFilterProvider = ({ children }) => {
  const { selectedCorpus } = useCorpus();
  const [corpusFilter, setCorpusFilter] = useState('lexicon');
  const [surahFilter, setSurahFilter] = useState([]);

  // Sync with selectedCorpus when user navigates to a corpus
  useEffect(() => {
    if (selectedCorpus) {
      setCorpusFilter(selectedCorpus.id);
    }
  }, [selectedCorpus]);

  // Reset surah filter whenever corpus changes away from Quran
  useEffect(() => {
    const id = typeof corpusFilter === 'string' ? parseInt(corpusFilter, 10) : corpusFilter;
    if (id !== 2) {
      setSurahFilter([]);
    }
  }, [corpusFilter]);

  return (
    <CorpusFilterContext.Provider value={{ corpusFilter, setCorpusFilter, surahFilter, setSurahFilter }}>
      {children}
    </CorpusFilterContext.Provider>
  );
};

export const useCorpusFilter = () => useContext(CorpusFilterContext);
