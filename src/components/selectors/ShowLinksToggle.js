import React, { createContext, useContext, useState } from 'react';

// Create context for show links state
const ShowLinksContext = createContext();

export const ShowLinksProvider = ({ children }) => {
  const [showLinks, setShowLinks] = useState(true);
  const [showLinkLabels, setShowLinkLabels] = useState(false);

  return (
    <ShowLinksContext.Provider value={{ showLinks, setShowLinks, showLinkLabels, setShowLinkLabels }}>
      {children}
    </ShowLinksContext.Provider>
  );
};

export const useShowLinks = () => {
  const context = useContext(ShowLinksContext);
  if (!context) {
    throw new Error('useShowLinks must be used within a ShowLinksProvider');
  }
  return context;
};

const ShowLinksToggle = () => {
  const { showLinks, setShowLinks, showLinkLabels, setShowLinkLabels } = useShowLinks();

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
        <button
          className={`mode-toggle-button ${showLinks ? 'active' : ''}`}
          onClick={() => setShowLinks(!showLinks)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: showLinks ? '#333' : '#f8f9fa',
            color: showLinks ? '#fff' : '#333',
            cursor: 'pointer',
            fontFamily: 'Noto Serif, serif'
          }}
        >
          Show Links
        </button>
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <button
          className={`mode-toggle-button ${showLinkLabels ? 'active' : ''}`}
          onClick={() => setShowLinkLabels(!showLinkLabels)}
          disabled={!showLinks}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: showLinkLabels && showLinks ? '#333' : '#f8f9fa',
            color: showLinkLabels && showLinks ? '#fff' : '#333',
            cursor: showLinks ? 'pointer' : 'not-allowed',
            opacity: showLinks ? 1 : 0.5,
            fontFamily: 'Noto Serif, serif'
          }}
        >
          Show Link Labels
        </button>
      </div>
    </div>
  );
};

export default ShowLinksToggle;