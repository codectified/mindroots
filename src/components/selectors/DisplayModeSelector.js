import React from 'react';
import { useDisplayMode } from '../../contexts/DisplayModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';

const DisplayModeSelector = () => {
  const { displayMode, setDisplayMode } = useDisplayMode();

  const handleToggle = () => {
    setDisplayMode((prevMode) => (prevMode === 'graph' ? 'table' : 'graph'));
  };

  return (
    <button
      className="mini-menu-button" // Smaller size for vertical stack
      onClick={handleToggle}
      style={{
        width: '30px',
        height: '30px',
        minWidth: '30px',
        minHeight: '30px',
        maxWidth: '30px',
        maxHeight: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: '#333',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '12px',
        border: 'none',
        transition: 'background-color 0.2s',
        padding: '0',
        flexShrink: 0
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#555'}
      onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
    >
      <FontAwesomeIcon icon={displayMode === 'graph' ? faTable : faProjectDiagram} />
    </button>
  );
};

export default DisplayModeSelector;