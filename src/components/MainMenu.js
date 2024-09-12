import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faGlobe, faInfoCircle, faNewspaper, faFileAlt, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import '../App.css'; // Make sure this points to your CSS file

const MainMenu = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="mainmenu-container">
      <div className="icon-grid">
      <div className="icon-item" onClick={() => handleNavigation('/corpus-menu')}>
          <FontAwesomeIcon icon={faBook} className="icon" />
          <span>Library</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/project-news')}>
          <FontAwesomeIcon icon={faNewspaper} className="icon" />
          <span>News</span>
        </div>

        <div className="icon-item" onClick={() => handleNavigation('/sandbox')}>
          <FontAwesomeIcon icon={faProjectDiagram} className="icon" />
          <span>Sandbox</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/introduction')}>
          <FontAwesomeIcon icon={faFileAlt} className="icon" />
          <span>Start Here</span>
        </div>
        <div className="icon-item settings-item" onClick={() => handleNavigation('/settings')}>
          <FontAwesomeIcon icon={faGlobe} className="icon" />
          <span>Settings</span>
        </div>
        <div className="icon-item about-item" onClick={() => handleNavigation('/about')}>
          <FontAwesomeIcon icon={faInfoCircle} className="icon" />
          <span>About</span>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;