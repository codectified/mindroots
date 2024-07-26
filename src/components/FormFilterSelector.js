import React from 'react';

const FormFilterSelector = ({ contextFilter, handleContextFilterChange }) => (
  <div>
    <label>Form Filter:</label>
    <select value={contextFilter} onChange={handleContextFilterChange}>
      <option value="mostExcellentNames">Most Excellent Names</option>
      <option value="lexicon">Lexicon</option>
      {/* Add more options as needed */}
    </select>
  </div>
);

export default FormFilterSelector;
