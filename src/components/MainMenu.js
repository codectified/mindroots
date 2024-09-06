import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faCog, faInfoCircle, faNewspaper, faFileAlt, faGamepad } from '@fortawesome/free-solid-svg-icons';
import '../App.css'; // Make sure this points to your CSS file

const MainMenu = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="mainmenu-container">
      <div className="icon-grid">
        <div className="icon-item" onClick={() => handleNavigation('/project-news')}>
          <FontAwesomeIcon icon={faNewspaper} className="icon" />
          <span>Project News</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/corpus-menu')}>
          <FontAwesomeIcon icon={faBook} className="icon" />
          <span>Corpus Library</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/games')}>
          <FontAwesomeIcon icon={faGamepad} className="icon" />
          <span>Games</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/articles')}>
          <FontAwesomeIcon icon={faFileAlt} className="icon" />
          <span>Articles</span>
        </div>
        <div className="icon-item settings-item" onClick={() => handleNavigation('/settings')}>
          <FontAwesomeIcon icon={faCog} className="icon" />
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