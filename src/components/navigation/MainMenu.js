import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faSearch, 
  faMapMarked, 
  faPodcast 
} from '@fortawesome/free-solid-svg-icons';
import { 
  faInstagram, 
  faLinkedin, 
  faYoutube,
  faGithub
} from '@fortawesome/free-brands-svg-icons'; // Import social media icons

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
          <span>Corpus Library</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/start')}>
          <FontAwesomeIcon icon={faMapMarked} className="icon" />
          <span>
            Graph Exploration
          </span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/sandbox')}>
          <FontAwesomeIcon icon={faSearch} className="icon" />
          <span>
            Positional Root Search
          </span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/lisan-lab')}>
          <FontAwesomeIcon icon={faPodcast} className="icon" />
          <span>Lisān Lab & Reports</span>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="statistics-section">
        <ul className="articles-list">
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/getting-started">Getting Started</Link>
          </li>
          <li>
            <Link to="/project-overview">Project Overview</Link>
          </li>
          <li>
            <Link to="/acknowledgements">Acknowledgements</Link>
          </li>
        </ul>
      </div>

      {/* Main Site and Social Links */}
      <div className="contact-info">
        <div className="social-links">
          <a href="https://www.instagram.com/omr.ib/" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="https://www.linkedin.com/in/ibomar/" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
          <a href="https://www.https://www.youtube.com/@codectified" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a href="https://github.com/codectified/mindroots" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faGithub} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;