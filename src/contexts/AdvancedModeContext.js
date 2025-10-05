import React, { createContext, useContext, useState, useEffect } from 'react';

const AdvancedModeContext = createContext();

export const useAdvancedMode = () => {
  const context = useContext(AdvancedModeContext);
  if (!context) {
    throw new Error('useAdvancedMode must be used within an AdvancedModeProvider');
  }
  return context;
};

export const AdvancedModeProvider = ({ children }) => {
  // Initialize from localStorage, default to false if not found
  const [isAdvancedMode, setIsAdvancedMode] = useState(() => {
    try {
      const saved = localStorage.getItem('advancedMode');
      return saved !== null ? JSON.parse(saved) : false;
    } catch (error) {
      console.error('Error loading advanced mode from localStorage:', error);
      return false;
    }
  });

  // Save to localStorage whenever the mode changes
  useEffect(() => {
    try {
      localStorage.setItem('advancedMode', JSON.stringify(isAdvancedMode));
      console.log('💾 Saved advanced mode to localStorage:', isAdvancedMode);
    } catch (error) {
      console.error('Error saving advanced mode to localStorage:', error);
    }
  }, [isAdvancedMode]);

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