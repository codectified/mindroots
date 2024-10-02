import React from 'react';
import { useLocation } from 'react-router-dom';
import '../../App.css';
const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className={location.pathname === "/" ? "markdown-homepage" : "app"}>
      {/* Conditionally render the overlay only on non-homepage routes */}
      {location.pathname !== "/" && (
        <div className="overlay">
            {children}
        </div>
      )}
      {location.pathname === "/" && (
        <div>{children}</div> /* No overlay on homepage */
      )}
    </div>
  );
};

export default Layout;