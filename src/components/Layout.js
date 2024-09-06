import React from 'react';
import { useLocation } from 'react-router-dom';
import '../App.css'; // Ensure the updated CSS is applied

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className={location.pathname === "/" ? "markdown-homepage" : "app"}>
      {/* Conditionally render the overlay only on non-homepage routes */}
      {location.pathname !== "/" && (
        <div className="overlay">
          <div className="menu-padding-wrapper"> {/* New wrapper to add top padding */}
            {children}
          </div>
        </div>
      )}
      {location.pathname === "/" && (
        <div>{children}</div> /* No overlay on homepage */
      )}
    </div>
  );
};

export default Layout;