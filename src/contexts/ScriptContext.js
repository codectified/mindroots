import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLanguages } from '../services/apiService';

const ScriptContext = createContext();

export const ScriptProvider = ({ children }) => {
  const [L1,    setL1]    = useState('english');
  const [L2,    setL2]    = useState('off');
  const [langs, setLangs] = useState([]);

  useEffect(() => {
    getLanguages()
      .then(setLangs)
      .catch(err => {
        console.error('Could not load languages:', err);
        // optionally fallback to ["english","arabic"]
      });
  }, []);

  return (
    <ScriptContext.Provider value={{ L1, setL1, L2, setL2, langs }}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useScript = () => useContext(ScriptContext);