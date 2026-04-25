import React, { createContext, useState, useEffect, useContext } from 'react';

const arabicFontMap = {
  amiri: "'Amiri', serif",
  noto:  "'Noto Naskh Arabic', serif",
  kufi:  "'Noto Kufi Arabic', sans-serif",
};

const latinFontMap = {
  serif:      "'Noto Serif', Georgia, serif",
  sans:       "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
};

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [isAdditionalSettingsOn, setAdditionalSettingsOn] = useState(false);

  const [arabicFont, setArabicFont] = useState(
    () => localStorage.getItem('arabicFont') || 'amiri'
  );

  const [latinFont, setLatinFont] = useState(
    () => localStorage.getItem('latinFont') || 'serif'
  );

  const arabicFontFamily = arabicFontMap[arabicFont] || arabicFontMap.amiri;
  const latinFontFamily  = latinFontMap[latinFont]   || latinFontMap.serif;

  useEffect(() => {
    localStorage.setItem('arabicFont', arabicFont);
    document.documentElement.style.setProperty('--font-arabic', arabicFontFamily);
  }, [arabicFont, arabicFontFamily]);

  useEffect(() => {
    localStorage.setItem('latinFont', latinFont);
    document.documentElement.style.setProperty('--font-latin', latinFontFamily);
  }, [latinFont, latinFontFamily]);

  const toggleAdditionalSettings = () => {
    setAdditionalSettingsOn(prev => !prev);
  };

  return (
    <SettingsContext.Provider value={{
      isAdditionalSettingsOn,
      toggleAdditionalSettings,
      arabicFont,    setArabicFont,    arabicFontFamily,
      latinFont,     setLatinFont,     latinFontFamily,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
