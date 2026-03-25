import React from 'react';
import { useDisplayMode } from '../../contexts/DisplayModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';

const DisplayModeSelector = ({ size = 'small' }) => {
  const { displayMode, setDisplayMode } = useDisplayMode();

  const handleToggle = () => {
    setDisplayMode((prevMode) => (prevMode === 'graph' ? 'table' : 'graph'));
  };

  const dim = size === 'large' ? '42px' : '30px';
  const fs  = size === 'large' ? '18px' : '12px';

  return (
    <button
      className="mini-menu-button"
      onClick={handleToggle}
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        minHeight: dim,
        maxWidth: dim,
        maxHeight: dim,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: '#333',
        color: '#fff',
        cursor: 'pointer',
        fontSize: fs,
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