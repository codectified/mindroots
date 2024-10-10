import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faPlay, faSearch, faMapMarked } from '@fortawesome/free-solid-svg-icons'; // Added tree and home icons
import '../../App.css';
const MainMenu = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="mainmenu-container">
      <div className="icon-grid">

      {/* <div className="icon-item home" onClick={() => handleNavigation('/')}>
        <img src="/root-tree.jpeg" alt="Tree Home Icon" className="custom-icon" />
        <span>Home</span>
      </div> */}



        <div className="icon-item" onClick={() => handleNavigation('/corpus-menu')}>
          <FontAwesomeIcon icon={faBook} className="icon" />
          <span>Library</span>
        </div>
        
        <div className="icon-item" onClick={() => handleNavigation('/start')}>
  <FontAwesomeIcon icon={faMapMarked} className="icon" />
  <span>Explore</span>
</div>

        <div className="icon-item" onClick={() => handleNavigation('/sandbox')}>
          <FontAwesomeIcon icon={faSearch} className="icon" />
          <span>Search</span>
        </div>


      </div>
      <div className="main-site-link">
        <a href="https://theoption.life" target="_blank" rel="noopener noreferrer">
          theoption.life
        </a>
      </div>
    </div>
  );
};

export default MainMenu;