import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faInfoCircle, faNewspaper, faHome } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../../content/about.md';
import changelogContent from '../../content/changelog.md';
import LanguageSelector from '../selectors/LanguageSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Added useLocation
import NodeLimitSlider from '../selectors/NodeLimitSlider';
import ModeToggleSwitchSwitch from '../selectors/ModeToggleSwitch';


const MiniMenu = () => {
  const location = useLocation(); // Get the current route
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    if (location.pathname === '/start' || location.pathname === '/sandbox' || location.pathname === '/corpus-menu') {
      setSelectedOption('settings'); // Toggle settings on for specific routes
    } else {
      setSelectedOption(null); // Toggle off for other routes
    }
  }, [location.pathname]);

  const toggleOption = (option) => {
    setSelectedOption((prevOption) => (prevOption === option ? null : option));
  };

  const handleHome = () => {
    navigate('/mindroots');
  };

  const renderContent = () => {
    if (selectedOption === 'settings') {
      return (
        <div className="content-container">

          Click the globe to toggle settings.

          Click <Link to="/getting-started">here</Link>  for more information. 
          <br></br>
          <LanguageSelector />
          <ContextShiftSelector />
          <NodeLimitSlider />
          <br></br>
          <ModeToggleSwitchSwitch />






        </div>
      );
    } else if (selectedOption === 'about') {
      return (
        <div className="content-container">
          <ReactMarkdown>{markdownContent.slice(23, 209)}</ReactMarkdown>
          <Link to="/about" className="read-more-link">Read More</Link>
        </div>
      );
    } else if (selectedOption === 'changelog') {
      return (
        <div className="content-container">
          <ReactMarkdown>{markdownContent.slice(0, 127)}</ReactMarkdown>
          <Link to="/project-overview" className="read-more-link">Project Overview and Status</Link>
        </div>
      );
    } else {
      return null; // Render nothing if no option is selected
    }
  };

  useEffect(() => {
    if (selectedOption === 'about') {
      fetch(aboutContent)
        .then(res => res.text())
        .then(text => setMarkdownContent(text));
    } else if (selectedOption === 'changelog') {
      fetch(changelogContent)
        .then(res => res.text())
        .then(text => setMarkdownContent(text));
    }
  }, [selectedOption]);

  return (
    <div>
      <div className="menu-container">
        <button
          className={`menu-button ${selectedOption === 'settings' ? 'active' : ''}`}
          onClick={() => toggleOption('settings')}
        >
          <FontAwesomeIcon icon={faGlobe} />
        </button>
        <button
          className={`menu-button ${selectedOption === 'about' ? 'active' : ''}`}
          onClick={() => toggleOption('about')}
        >
          <FontAwesomeIcon icon={faInfoCircle} />
        </button>
        <button
          className={`menu-button ${selectedOption === 'changelog' ? 'active' : ''}`}
          onClick={() => toggleOption('changelog')}
        >
          <FontAwesomeIcon icon={faNewspaper} />
        </button>
        <button
          className="menu-button"
          onClick={handleHome}
        >
          <FontAwesomeIcon icon={faHome} />
        </button>
      </div>
      <div>
        {renderContent()} {/* Display the selected content */}
      </div>
    </div>
  );
};

export default MiniMenu;

