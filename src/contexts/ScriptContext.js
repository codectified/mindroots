import React, { createContext, useState, useContext } from 'react';

const ScriptContext = createContext();

export const ScriptProvider = ({ children }) => {
  const [script, setScript] = useState('arabic');

  return (
    <ScriptContext.Provider value={{ script, setScript }}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useScript = () => useContext(ScriptContext);
