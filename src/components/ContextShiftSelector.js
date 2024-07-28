// src/components/ContextShiftSelector.js

import React, { useEffect } from 'react';
import { useCorpus } from './CorpusContext';

const ContextShiftSelector = ({ contextFilter, handleContextFilterChange, corpora }) => {
  const { selectedCorpus } = useCorpus();

  useEffect(() => {
    if (selectedCorpus) {
      handleContextFilterChange({ target: { value: `corpus_${selectedCorpus.id}` } });
    }
  }, [selectedCorpus, handleContextFilterChange]);

  useEffect(() => {
    console.log(`Context filter changed to: ${contextFilter}`);
  }, [contextFilter]);

  return (
    <select value={contextFilter} onChange={handleContextFilterChange}>
      <option value="lexicon">Lexicon</option>
      {corpora.map(corpus => (
        <option key={corpus.id} value={`corpus_${corpus.id}`}>{corpus.name}</option>
      ))}
      <option value="currentRoots">Current Root(s)</option>
    </select>
  );
};

export default ContextShiftSelector;
