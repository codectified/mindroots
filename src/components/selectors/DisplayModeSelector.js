// ../components/selectors/DisplayModeSelector.js
import React from 'react';
import { useDisplayMode } from '../../contexts/DisplayModeContext';

const DisplayModeSelector = () => {
  const { displayMode, setDisplayMode } = useDisplayMode();

  const handleChange = (event) => {
    setDisplayMode(event.target.value);
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '10px 0'
      }}
    >
      <label style={{ whiteSpace: 'nowrap' }}>Display Mode:</label>
      <div style={{ display: 'flex', gap: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="graph"
            checked={displayMode === 'graph'}
            onChange={handleChange}
          />
          Graph
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="table"
            checked={displayMode === 'table'}
            onChange={handleChange}
          />
          Table
        </label>
      </div>
    </div>
  );
};

export default DisplayModeSelector;