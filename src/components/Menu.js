import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faInfoCircle, faHistory } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../content/about.md';
import changelogContent from '../content/changelog.md';
import Settings from './Settings';

const Menu = ({ script, handleScriptChange, contextFilterRoot, contextFilterForm, handleContextFilterChange, corpora }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');

  const toggleOption = (option) => {
    setSelectedOption((prevOption) => (prevOption === option ? null : option));
  };

  const renderContent = () => {
    switch (selectedOption) {
      case 'settings':
        return (
          <Settings
            script={script}
            handleScriptChange={handleScriptChange}
            contextFilterRoot={contextFilterRoot}
            contextFilterForm={contextFilterForm}
            handleContextFilterChange={handleContextFilterChange}
            corpora={corpora}
          />
        );
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
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default Menu;
