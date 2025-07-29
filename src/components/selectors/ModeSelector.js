import React from 'react';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';

const ModeSelector = () => {
  const { isAdvancedMode, toggleAdvancedMode } = useAdvancedMode();

  return (
    <div className="selector-pair" style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <button
          className={`mode-toggle-button ${!isAdvancedMode ? 'active' : ''}`}
          onClick={() => !isAdvancedMode || toggleAdvancedMode()}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: !isAdvancedMode ? '#333' : '#f8f9fa',
            color: !isAdvancedMode ? '#fff' : '#333',
            cursor: 'pointer',
            fontFamily: 'Noto Serif, serif'
          }}
        >
          Guided
        </button>
        <button
          className={`mode-toggle-button ${isAdvancedMode ? 'active' : ''}`}
          onClick={() => isAdvancedMode || toggleAdvancedMode()}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: isAdvancedMode ? '#333' : '#f8f9fa',
            color: isAdvancedMode ? '#fff' : '#333',
            cursor: 'pointer',
            fontFamily: 'Noto Serif, serif'
          }}
        >
          Advanced
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;