import React from 'react';
import LanguageSelector from './LanguageSelector';
import ContextShiftSelector from './ContextShiftSelector';
import Menu from './Menu';

const Settings = () => {
  return (
    <div>
      <Menu />
      <h2>Settings</h2>
      <LanguageSelector />
      <ContextShiftSelector />
    </div>
  );
};

export default Settings;