import React from 'react';
import LanguageSelector from '../selectors/LanguageSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import NodeLimitSlider from '../selectors/NodeLimitSlider'; 

const Settings = () => {
  return (
    <div>
      <h2>Settings</h2>
      <LanguageSelector />
      <ContextShiftSelector />
      <NodeLimitSlider /> 
    </div>
  );
};

export default Settings;