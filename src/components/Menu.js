import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faInfoCircle, faHistory, faHome } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../content/about.md';
import changelogContent from '../content/changelog.md';
import Settings from './Settings';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const navigate = useNavigate();

  const toggleOption = (option) => {
    setSelectedOption((prevOption) => (prevOption === option ? null : option));
  };

  const handleHome = () => {
    navigate('/');
  };

  const renderContent = () => {
    switch (selectedOption) {
      case 'settings':
        return <Settings />; // Render the full Settings component
      case 'about':
        return (
          <div>
            <h2>About</h2>
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </div>
        );
      case 'changelog':
        return (
          <div>
            <h2>Changelog</h2>
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </div>
        );
      default:
        return null;
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
          <FontAwesomeIcon icon={faCog} />
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
          <FontAwesomeIcon icon={faHistory} />
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
