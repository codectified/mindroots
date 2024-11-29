// ../contexts/WordShadeContext.js
import React, { createContext, useState, useContext } from 'react';

const WordShadeContext = createContext();

export const WordShadeProvider = ({ children }) => {
  const [wordShadeMode, setWordShadeMode] = useState('grammatical'); // Default mode

  const toggleWordShadeMode = () => {
    setWordShadeMode((prevMode) => (prevMode === 'grammatical' ? 'ontological' : 'grammatical'));
  };

  return (
    <WordShadeContext.Provider value={{ wordShadeMode, toggleWordShadeMode }}>
      {children}
    </WordShadeContext.Provider>
  );
};

export const useWordShade = () => useContext(WordShadeContext);