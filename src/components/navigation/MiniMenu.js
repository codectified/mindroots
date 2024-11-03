import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faInfoCircle, faNewspaper, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../../content/about.md';
import changelogContent from '../../content/changelog.md';
import LanguageSelector from '../selectors/LanguageSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import NodeLimitSlider from '../selectors/NodeLimitSlider';
import HighlightController from '../selectors/HighlightController';
import TextLayoutToggle from '../selectors/TextLayoutSelector';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const MiniMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null); // Start with null by default
  const [markdownContent, setMarkdownContent] = useState('');
  const [showAdditionalSettings, setShowAdditionalSettings] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false); // New state for expanding/collapsing menu

  useEffect(() => {
    if (location.pathname === '/start' || location.pathname === '/sandbox' || location.pathname === '/corpus-menu') {
      setSelectedOption(null); // Do not open settings by default
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
          <br />

          Click <Link to="/getting-started">here</Link> for more information.
          <br />
          <br />

          <LanguageSelector />
          <br />


          {/* Additional Settings Toggle */}
          <div className="additional-settings-toggle" onClick={() => setShowAdditionalSettings(prev => !prev)}>
            Additional Settings
            <FontAwesomeIcon icon={showAdditionalSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
          </div>

          {/* Conditionally render additional settings */}
          {showAdditionalSettings && (
            <>
              <br />
              <TextLayoutToggle />
              <HighlightController />
              <ContextShiftSelector />
              <NodeLimitSlider />
            </>
          )}
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
          <ReactMarkdown>{markdownContent.slice(0, 1270)}</ReactMarkdown>
          <Link to="/project-overview" className="read-more-link">Project Overview and Status</Link>
        </div>
      );
    } else {
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
        {/* Only show additional buttons if the menu is expanded */}
        {isMenuExpanded && (
          <>
            <button className={`menu-button ${selectedOption === 'settings' ? 'active' : ''}`} onClick={() => toggleOption('settings')}>
              <FontAwesomeIcon icon={faGlobe} />
            </button>
            <button className={`menu-button ${selectedOption === 'about' ? 'active' : ''}`} onClick={() => toggleOption('about')}>
              <FontAwesomeIcon icon={faInfoCircle} />
            </button>
            <button className={`menu-button ${selectedOption === 'changelog' ? 'active' : ''}`} onClick={() => toggleOption('changelog')}>
              <FontAwesomeIcon icon={faNewspaper} />
            </button>
          </>
        )}

        {/* Mindroots button that toggles menu expansion */}
        <a href="/mindroots" className="mindroots-button" onClick={(e) => { e.preventDefault(); setIsMenuExpanded(prev => !prev); }}>
          <img src={`${process.env.PUBLIC_URL}/root-tree.jpeg`} alt="Mindroots" className="button-icon" />
          <FontAwesomeIcon icon={isMenuExpanded ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
        </a>
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default MiniMenu;