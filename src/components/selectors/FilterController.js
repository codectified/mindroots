// ../components/selectors/FilterController.js
import React from 'react';
import { useFilter } from '../../contexts/FilterContext';

const FilterController = () => {
  const { filterWordTypes, toggleWordType } = useFilter();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', padding: '10px 0' }}>
      <label>Filter by Word Type:</label>

      {['phrase', 'verb', 'noun', 'unclassified'].map(type => (
        <label key={type}>
          <input
            type="checkbox"
            checked={filterWordTypes.includes(type)}
            onChange={() => toggleWordType(type)}
          />
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </label>
      ))}
    </div>
  );
};

export default FilterController;