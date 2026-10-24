// contexts/TextLayoutContext.js
import React, { createContext, useContext, useState } from 'react';

const TextLayoutContext = createContext();
const LAYOUT_KEY = 'textLayout'; // remembered across visits

export const TextLayoutProvider = ({ children }) => {
  const [layout, setLayoutState] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) === 'prose' ? 'prose' : 'line-by-line';
    } catch {
      return 'line-by-line';
    }
  });
  const setLayout = (value) => {
    setLayoutState(value);
    try {
      localStorage.setItem(LAYOUT_KEY, value);
    } catch {
      /* private mode: keep the in-memory setting only */
    }
  };

  return (
    <TextLayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </TextLayoutContext.Provider>
  );
};

export const useTextLayout = () => useContext(TextLayoutContext);