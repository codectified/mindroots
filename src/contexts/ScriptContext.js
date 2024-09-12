import React, { createContext, useState, useContext } from 'react';

const ScriptContext = createContext();

export const ScriptProvider = ({ children }) => {
  const [L1, setL1] = useState('arabic'); // Primary language (default to 'english')
  const [L2, setL2] = useState('off');     // Secondary language (default to 'off')

  return (
    <ScriptContext.Provider value={{ L1, setL1, L2, setL2 }}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useScript = () => useContext(ScriptContext);
