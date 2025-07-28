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
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={showLinks}
          onChange={(e) => setShowLinks(e.target.checked)}
          style={{ marginRight: '8px' }}
        />
        <span style={{ fontSize: '14px' }}>Show Links</span>
      </label>
    </div>
  );
};

export default ShowLinksToggle;