import React from 'react';
import { useDisplayMode } from '../../contexts/DisplayModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';

const DisplayModeSelector = ({ size = 'small' }) => {
  const { displayMode, setDisplayMode } = useDisplayMode();

  const handleToggle = () => {
    setDisplayMode((prevMode) => (prevMode === 'graph' ? 'table' : 'graph'));
  };

  const sizeClass = size === 'large'
    ? 'w-[42px] h-[42px] min-w-[42px] min-h-[42px] max-w-[42px] max-h-[42px] text-[18px]'
    : 'w-[30px] h-[30px] min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] text-[12px]';

  return (
    <button
      className={`mini-menu-button ${sizeClass} flex items-center justify-center rounded-full bg-ink text-white cursor-pointer border-none transition-[background-color] duration-200 p-0 flex-shrink-0 hover:bg-ink-hover`}
      onClick={handleToggle}
    >
      <FontAwesomeIcon icon={displayMode === 'graph' ? faTable : faProjectDiagram} />
    </button>
  );
};

export default DisplayModeSelector;