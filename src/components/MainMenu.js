import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faCog, faInfoCircle, faNewspaper } from '@fortawesome/free-solid-svg-icons';

const MainMenu = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="mainmenu-container">
      <h1 className="mainmenu-title">MindRoots</h1>
      <ul className="mainmenu-list">
        <li className="mainmenu-item" onClick={() => handleNavigation('/project-news')}>
          <FontAwesomeIcon icon={faNewspaper} className="mainmenu-icon" />
          Project News
        </li>
        <li className="mainmenu-item" onClick={() => handleNavigation('/corpus-menu')}>
          <FontAwesomeIcon icon={faBook} className="mainmenu-icon" />
          Corpus Library
        </li>
        <li className="mainmenu-item" onClick={() => handleNavigation('/settings')}>
          <FontAwesomeIcon icon={faCog} className="mainmenu-icon" />
          Language and Global Settings
        </li>
        <li className="mainmenu-item" onClick={() => handleNavigation('/about')}>
          <FontAwesomeIcon icon={faInfoCircle} className="mainmenu-icon" />
          What's this about?
        </li>
      </ul>
    </div>
  );
};

export default MainMenu;
