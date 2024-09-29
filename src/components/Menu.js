import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faInfoCircle, faNewspaper, faHome } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../content/about.md';
import changelogContent from '../content/changelog.md';
import LanguageSelector from './LanguageSelector';
import ContextShiftSelector from './ContextShiftSelector';
import { useNavigate, Link } from 'react-router-dom';
import NodeLimitSlider from './NodeLimitSlider'; // Import the new component


const Menu = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const navigate = useNavigate();

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
          <LanguageSelector />
          <ContextShiftSelector />
          <NodeLimitSlider /> 
        </div>
      );
    } else if (selectedOption === 'about') {
      return (
        <div className="content-container">
          <ReactMarkdown>{markdownContent.slice(0, 209)}</ReactMarkdown>
          <Link to="/about" className="read-more-link">Read More</Link>
        </div>
      );
    } else if (selectedOption === 'changelog') {
      return (
        <div className="content-container">
          <h2>Project News</h2>
          <ReactMarkdown>{markdownContent.slice(0, 100)}</ReactMarkdown>
          <Link to="/project-news" className="read-more-link">View Full Changelog</Link>
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

export default Menu;