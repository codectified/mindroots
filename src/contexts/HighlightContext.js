import React, { createContext, useState, useContext } from 'react';

const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
  const [highlightGender, setHighlightGender] = useState(null); // Default to no gender highlighting
  const [highlightVerb, setHighlightVerb] = useState(false); // Default to no verb highlighting
  const [highlightParticle, setHighlightParticle] = useState(false); // Default to no particle highlighting
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