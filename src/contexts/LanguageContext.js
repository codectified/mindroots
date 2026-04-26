import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAdvancedMode } from './AdvancedModeContext';

const LanguageContext = createContext();

const isArabicL1 = (l1) => l1 === 'arabic';

export const LanguageProvider = ({ children }) => {
  const { isAdvancedMode } = useAdvancedMode();
  const [L1, setL1] = useState(isAdvancedMode ? 'sem' : 'english');
  const [L2, setL2] = useState('off');

  // Update L1 default when mode changes
  useEffect(() => {
    const defaultL1 = isAdvancedMode ? 'sem' : 'english';
    setL1(defaultL1);
  }, [isAdvancedMode]);

  // Switch body font and html font-size scale based on UI language.
  // Arabic mode: Arabic font + Arabic size slider drives the whole UI.
  // English mode: Latin font + English size slider drives the whole UI.
  useEffect(() => {
    const arabic = isArabicL1(L1);
    document.documentElement.style.setProperty(
      '--font-body',
      arabic ? 'var(--font-arabic)' : 'var(--font-latin)'
    );
    document.documentElement.style.setProperty(
      '--font-scale-active',
      arabic ? 'var(--font-scale-semitic)' : 'var(--font-scale-latin)'
    );
  }, [L1]);

  return (
    <LanguageContext.Provider value={{ L1, setL1, L2, setL2 }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
