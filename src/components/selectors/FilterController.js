// ../components/selectors/FilterController.js
import React from 'react';
import { useFilter } from '../../contexts/FilterContext';

const FilterController = () => {
  const { filterWordTypes, toggleWordType, hideFormNodes, toggleHideFormNodes } = useFilter();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', padding: '10px 0' }}>
      <label>Filter by Nodes:</label>

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

      <br></br>

      <label>
        <input
          type="checkbox"
          checked={hideFormNodes}
          onChange={toggleHideFormNodes}
        />
        Hide Form Nodes
      </label>
    </div>
  );
};

export default FilterController;