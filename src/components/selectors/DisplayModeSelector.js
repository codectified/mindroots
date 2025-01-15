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
      className="small-icon-button" // Same class as other buttons
      onClick={handleToggle}
    >
      <FontAwesomeIcon icon={displayMode === 'graph' ? faTable : faProjectDiagram} size="lg" />
    </button>
  );
};

export default DisplayModeSelector;