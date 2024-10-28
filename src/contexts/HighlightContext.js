// ../contexts/HighlightContext.js
import React, { createContext, useState, useContext } from 'react';

const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
  const [highlightGender, setHighlightGender] = useState(null); // 'masculine', 'feminine', or null
  const [highlightVerb, setHighlightVerb] = useState(false);
  const [highlightParticle, setHighlightParticle] = useState(false);

  return (
    <HighlightContext.Provider 
      value={{ 
        highlightGender, 
        setHighlightGender, 
        highlightVerb, 
        setHighlightVerb, 
        highlightParticle, 
        setHighlightParticle 
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
};

export const useHighlight = () => useContext(HighlightContext);