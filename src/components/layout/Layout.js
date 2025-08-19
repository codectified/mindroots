import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from '../navigation/BottomNav';

const Layout = ({ children }) => {
  const location = useLocation();

  // Homepage - simple container, no navigation
  if (location.pathname === "/") {
    return (
      <div className="markdown-homepage">
        {children}
      </div>
    );
  }

  // MainMenu page - no bottom navigation
  if (location.pathname === "/mindroots") {
    return (
      <div className="app">
        {children}
      </div>
    );
  }

  // All other pages - with bottom navigation and proper spacing
  return (
    <>
      <div className="app">
        <div className="overlay">
          {children}
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default Layout;