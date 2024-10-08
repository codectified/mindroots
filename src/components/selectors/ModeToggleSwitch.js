import React from 'react';
import { useGraphData } from '../../contexts/GraphDataContext';

const ModeToggleSwitch = () => {
  const { mode, setMode } = useGraphData(); // Make sure you're destructuring both mode and setMode

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'guided' ? 'advanced' : 'guided'));
  };

  return (
    <div>
      <button onClick={toggleMode}>
        {mode === 'guided' ? 'Switch to Advanced Mode' : 'Switch to Guided Mode'}
      </button>
    </div>
  );
};

export default ModeToggleSwitch;