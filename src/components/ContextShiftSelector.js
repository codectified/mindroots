import React from 'react';

const ContextShiftSelector = ({ contextFilter, handleContextFilterChange }) => (
  <select value={contextFilter} onChange={handleContextFilterChange}>
    <option value="lexicon">Lexicon</option>
    <option value="corpus1">Corpus 1</option>
    <option value="corpus2">Corpus 2</option>
    <option value="currentRoots">Current Root(s)</option>
  </select>
);

export default ContextShiftSelector;
