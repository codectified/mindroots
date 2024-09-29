import React from 'react';
import LanguageSelector from './LanguageSelector';
import ContextShiftSelector from './ContextShiftSelector';
import NodeLimitSlider from './NodeLimitSlider'; 
import Menu from './Menu';

const Settings = () => {
  return (
    <div>
      <Menu />
      <h2>Settings</h2>
      <LanguageSelector />
      <ContextShiftSelector />
      <NodeLimitSlider /> 
    </div>
  );
};

export default Settings;