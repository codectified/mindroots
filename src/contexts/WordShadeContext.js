// ../contexts/WordShadeContext.js
import React, { createContext, useContext, useState } from 'react';

const WordShadeContext = createContext();

export const WordShadeProvider = ({ children }) => {
  const [wordShadeMode, setWordShadeMode] = useState('ontological'); // Default to 'ontological'

  return (
    <WordShadeContext.Provider value={{ wordShadeMode, setWordShadeMode }}>
      {children}
    </WordShadeContext.Provider>
  );
};

export const useWordShade = () => useContext(WordShadeContext);