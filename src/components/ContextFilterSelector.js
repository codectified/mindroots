import React from 'react';

const ContextFilterSelector = ({ contextFilter, handleContextFilterChange }) => (
  <label>
    Context Filter:
    <select value={contextFilter} onChange={handleContextFilterChange}>
      <option value="lexicon">Lexicon</option>
      <option value="corpus">The Most Excellent Names</option>
    </select>
  </label>
);

export default ContextFilterSelector;
