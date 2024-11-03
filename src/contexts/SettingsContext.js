import React, { createContext, useState, useContext } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [isAdditionalSettingsOn, setAdditionalSettingsOn] = useState(false);

  const toggleAdditionalSettings = () => {
    setAdditionalSettingsOn(prev => !prev);
  };

  return (
    <SettingsContext.Provider value={{ isAdditionalSettingsOn, toggleAdditionalSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);