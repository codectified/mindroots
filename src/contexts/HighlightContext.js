// ../contexts/HighlightContext.js
import React, { createContext, useState, useContext } from 'react';

const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
  const [highlightGender, setHighlightGender] = useState(null); // 'masculine', 'feminine', or null

  return (
    <HighlightContext.Provider value={{ highlightGender, setHighlightGender }}>
      {children}
    </HighlightContext.Provider>
  );
};

export const useHighlight = () => useContext(HighlightContext);