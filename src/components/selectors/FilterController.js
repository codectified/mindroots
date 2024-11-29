// ../components/selectors/FilterController.js
import React from 'react';
import { useFilter } from '../../contexts/FilterContext';

const FilterController = () => {
  const { filterWordTypes, toggleWordType, hideFormNodes, toggleHideFormNodes } = useFilter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
      <label>Filter by Nodes:</label>

      {['phrase', 'verb', 'noun', 'unclassified'].map(type => (
        <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox" // Keep it as a checkbox for multi-select
            checked={filterWordTypes.includes(type)}
            onChange={() => toggleWordType(type)}
            style={{
              appearance: 'none', // Hide the default checkbox
              width: '16px',
              height: '16px',
              borderRadius: '50%', // Make it circular like a radio button
              border: '2px solid #666',
              cursor: 'pointer',
              backgroundColor: filterWordTypes.includes(type) ? '#007bff' : 'transparent',
            }}
          />
          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </label>
      ))}

      <br />

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          checked={hideFormNodes}
          onChange={toggleHideFormNodes}
          style={{
            appearance: 'none',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid #666',
            cursor: 'pointer',
            backgroundColor: hideFormNodes ? '#007bff' : 'transparent',
          }}
        />
        <span>Hide Form Nodes</span>
      </label>
    </div>
  );
};

export default FilterController;