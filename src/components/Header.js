import React from 'react';

const Header = ({ script, onSwitchScript, onToggleForms, onToggleRoots, onIncreaseNodes, onDecreaseNodes, onMainScreen, onPreviousName, onNextName }) => {
  return (
    <div className="header">
      <div className="segmented-control">
        <button className={script === 'arabic' ? 'active' : ''} onClick={() => onSwitchScript('arabic')}>Arabic</button>
        <button className={script === 'english' ? 'active' : ''} onClick={() => onSwitchScript('english')}>English</button>
        <button className={script === 'both' ? 'active' : ''} onClick={() => onSwitchScript('both')}>Both</button>
      </div>
      <div className="control-panel">
        <button onClick={onToggleForms}>Show/Hide Forms</button>
        <button onClick={onToggleRoots}>Show/Hide Roots</button>
        <button onClick={onIncreaseNodes}>Increase Nodes</button>
        <button onClick={onDecreaseNodes}>Decrease Nodes</button>
        <button onClick={onMainScreen}>Main Screen</button>
        <button onClick={onPreviousName}>Previous Name</button>
        <button onClick={onNextName}>Next Name</button>
      </div>
    </div>
  );
};

export default Header;
