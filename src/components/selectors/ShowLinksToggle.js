import React, { createContext, useContext, useState } from 'react';

// Create context for show links state
const ShowLinksContext = createContext();

export const ShowLinksProvider = ({ children }) => {
  const [showLinks, setShowLinks] = useState(true);

  return (
    <ShowLinksContext.Provider value={{ showLinks, setShowLinks }}>
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
  const { showLinks, setShowLinks } = useShowLinks();

  return (
    <div style={{ marginBottom: '10px' }}>
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
  );
};

export default ShowLinksToggle;