import React, { createContext, useState, useContext } from 'react';

const SemiticLanguageFilterContext = createContext();

// Define the Semitic language groups
export const semiticLanguageGroups = {
  "Classical Semitic": ["Arabic", "Hebrew", "Aramaic", "Syriac"],
  "Ancient South Arabian": ["Sabaic", "Qatabanic", "Minaic", "Hadramitic"],
  "Ancient North Arabian": ["Safaitic", "Hismaic", "Dadanitic", "Taymanitic", "Thamudic_B"],
  "Ancient Northwest Semitic": ["Phoenician", "Ugaritic", "Moabite", "Ammonite"],
  "East Semitic": ["Akkadian", "Eblaite"],
  "Ethiopian Semitic": ["Ge'ez", "Amharic"],
  "Modern South Arabian": ["Mehri", "Harsusi"],
  "Aramaic Dialects": ["Mandaic", "Palmyrene", "Nabataean", "Hatran"],
  "Other": ["Amorite", "Hasaitic", "Maltese"]
};

// Get all unique languages
const getAllLanguages = () => {
  const allLanguages = [];
  Object.values(semiticLanguageGroups).forEach(group => {
    allLanguages.push(...group);
  });
  return [...new Set(allLanguages)].sort();
};

export const SemiticLanguageFilterProvider = ({ children }) => {
  // Initialize with all languages selected (show all by default)
  const [selectedSemiticLanguages, setSelectedSemiticLanguages] = useState(getAllLanguages());

  return (
    <SemiticLanguageFilterContext.Provider value={{
      selectedSemiticLanguages,
      setSelectedSemiticLanguages,
      semiticLanguageGroups,
      getAllLanguages
    }}>
      {children}
    </SemiticLanguageFilterContext.Provider>
  );
};

export const useSemiticLanguageFilter = () => {
  const context = useContext(SemiticLanguageFilterContext);
  if (!context) {
    throw new Error('useSemiticLanguageFilter must be used within a SemiticLanguageFilterProvider');
  }
  return context;
};