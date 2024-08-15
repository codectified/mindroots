import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faInfoCircle, faHistory } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../content/about.md';
import changelogContent from '../content/changelog.md';
import Settings from './Settings'; // Import the Settings component

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
      <div style={styles.menuContainer}>
        <button
          style={{
            ...styles.menuButton,
            backgroundColor: selectedOption === 'settings' ? '#4a4a4a' : '#333',
          }}
          onClick={() => toggleOption('settings')}
        >
          <FontAwesomeIcon icon={faCog} />
        </button>
        <button
          style={{
            ...styles.menuButton,
            backgroundColor: selectedOption === 'about' ? '#4a4a4a' : '#333',
          }}
          onClick={() => toggleOption('about')}
        >
          <FontAwesomeIcon icon={faInfoCircle} />
        </button>
        <button
          style={{
            ...styles.menuButton,
            backgroundColor: selectedOption === 'changelog' ? '#4a4a4a' : '#333',
          }}
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

const styles = {
  menuContainer: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  menuButton: {
    padding: '10px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#333',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Menu;
