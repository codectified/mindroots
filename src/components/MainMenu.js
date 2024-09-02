import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faCog, faInfoCircle, faNewspaper, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import '../App.css'; // Make sure this points to your CSS file

const MainMenu = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="mainmenu-container">
      <h1 className="mainmenu-title">MindRoots</h1>
      <div className="icon-grid">
        <div className="icon-item" onClick={() => handleNavigation('/project-news')}>
          <FontAwesomeIcon icon={faNewspaper} className="icon" />
          <span>Project News</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/corpus-menu')}>
          <FontAwesomeIcon icon={faBook} className="icon" />
          <span>Corpus Library</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/settings')}>
          <FontAwesomeIcon icon={faCog} className="icon" />
          <span>Settings</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/about')}>
          <FontAwesomeIcon icon={faInfoCircle} className="icon" />
          <span>About</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/articles')}>
          <FontAwesomeIcon icon={faFileAlt} className="icon" />
          <span>Articles</span>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;