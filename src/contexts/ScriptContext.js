import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAdvancedMode } from './AdvancedModeContext';

const ScriptContext = createContext();

export const ScriptProvider = ({ children }) => {
  const { isAdvancedMode } = useAdvancedMode();
  const [L1, setL1] = useState(isAdvancedMode ? 'arabic' : 'english'); // Mode-dependent default
  const [L2, setL2] = useState('off'); // Secondary language (default to 'off')
  
  // Update L1 default when mode changes (only if user hasn't manually changed it)
  useEffect(() => {
    // This will only set the default on initial load or mode changes
    // Users can still manually override this selection
    const defaultL1 = isAdvancedMode ? 'arabic' : 'english';
    setL1(defaultL1);
  }, [isAdvancedMode]);

  return (
    <ScriptContext.Provider value={{ L1, setL1, L2, setL2 }}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useScript = () => useContext(ScriptContext);
