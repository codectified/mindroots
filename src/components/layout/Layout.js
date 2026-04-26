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
        <div className="px-4 pt-4 pb-6 xs:px-5 xs:pt-5 md:px-10 md:pt-8 md:pb-8 max-w-[1440px] mx-auto">
          {children}
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default Layout;