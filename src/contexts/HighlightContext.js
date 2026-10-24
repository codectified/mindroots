import React, { createContext, useState, useContext } from 'react';

const HighlightContext = createContext();

// One palette for the legend (HighlightController) and the readers
export const HIGHLIGHT_COLORS = {
  noun: '#8E44AD',
  feminine: '#D4A017',
  verb: '#2E9E2E',
  particle: '#007BFF',
};

export const HighlightProvider = ({ children }) => {
  const [highlightGender, setHighlightGender] = useState(null); // Default to no gender highlighting
  const [highlightNoun, setHighlightNoun] = useState(false);
  const [highlightVerb, setHighlightVerb] = useState(false); // Default to no verb highlighting
  const [highlightParticle, setHighlightParticle] = useState(false); // Default to no particle highlighting
  const [freeformMode, setFreeformMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#FF4500'); // Default highlight color (orange)

  return (
    <HighlightContext.Provider
      value={{
        highlightGender,
        setHighlightGender,
        highlightNoun,
        setHighlightNoun,
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