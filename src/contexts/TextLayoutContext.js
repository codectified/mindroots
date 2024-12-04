// contexts/TextLayoutContext.js
import React, { createContext, useContext, useState } from 'react';

const TextLayoutContext = createContext();

export const TextLayoutProvider = ({ children }) => {
  const [layout, setLayout] = useState('line-by-line'); // Default to prose layout

  return (
    <TextLayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </TextLayoutContext.Provider>
  );
};

export const useTextLayout = () => useContext(TextLayoutContext);