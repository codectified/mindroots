import React, { createContext, useContext, useState } from 'react';

const AdvancedModeContext = createContext();

export const useAdvancedMode = () => {
  const context = useContext(AdvancedModeContext);
  if (!context) {
    throw new Error('useAdvancedMode must be used within an AdvancedModeProvider');
  }
  return context;
};

export const AdvancedModeProvider = ({ children }) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  const toggleAdvancedMode = () => {
    setIsAdvancedMode(prev => !prev);
  };

  const value = {
    isAdvancedMode,
    toggleAdvancedMode
  };

  return (
    <AdvancedModeContext.Provider value={value}>
      {children}
    </AdvancedModeContext.Provider>
  );
};