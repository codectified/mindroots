import React from 'react';

const ContextShiftSelector = ({ contextFilter, handleContextFilterChange, corpora }) => (
  <select value={contextFilter} onChange={handleContextFilterChange}>
    <option value="lexicon">Lexicon</option>
    {corpora.map(corpus => (
      <option key={corpus.id} value={`corpus_${corpus.id}`}>{corpus.name}</option>
    ))}
    <option value="currentRoots">Current Root(s)</option>
  </select>
);

export default ContextShiftSelector;
