import React, { createContext, useState, useContext } from 'react';

const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
  const [highlightGender, setHighlightGender] = useState('feminine'); // Default to highlighting feminine nouns
  const [highlightVerb, setHighlightVerb] = useState(true); // Default to highlighting verbs
  const [highlightParticle, setHighlightParticle] = useState(true); // Default to highlighting particles
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