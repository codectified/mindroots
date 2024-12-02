import React, { createContext, useState, useContext } from 'react';

const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
  const [highlightGender, setHighlightGender] = useState(null); // 'masculine', 'feminine', or null
  const [highlightVerb, setHighlightVerb] = useState(false);
  const [highlightParticle, setHighlightParticle] = useState(false);
  const [freeformMode, setFreeformMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#FF4500'); // Default highlight color (orange)

  return (
    <HighlightContext.Provider
      value={{
        highlightGender,
        setHighlightGender,
        highlightVerb,
        setHighlightVerb,
        highlightParticle,
        setHighlightParticle,
        freeformMode,
        setFreeformMode,
        highlightColor, // Add color state
        setHighlightColor, // Add setter for color state
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
};

export const useHighlight = () => useContext(HighlightContext);