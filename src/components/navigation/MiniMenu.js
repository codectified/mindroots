import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faChevronDown, faChevronUp, faBook, faMapMarked, faSearch, faInfoCircle, faNewspaper } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../../content/about.md';
import changelogContent from '../../content/changelog.md';
import LanguageSelector from '../selectors/LanguageSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import NodeLimitSlider from '../selectors/NodeLimitSlider';
import HighlightController from '../selectors/HighlightController';
import TextLayoutToggle from '../selectors/TextLayoutSelector';
import FilterController from '../selectors/FilterController';
import WordShadeSelector from '../selectors/WordShadeSelector';
import DisplayModeSelector from '../selectors/DisplayModeSelector';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const MiniMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [showTextSettings, setShowTextSettings] = useState(false);
  const [isGraphMode, setIsGraphMode] = useState(false); // Toggle for Graph/Table mode
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [showOtherSettings, setShowOtherSettings] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const holdTimeout = useRef(null);

  useEffect(() => {
    if (location.pathname === '/start' || location.pathname === '/sandbox' || location.pathname === '/corpus-menu') {
      setSelectedOption(null);
    }
  }, [location.pathname]);

  const toggleOption = (option) => {
    setSelectedOption((prevOption) => (prevOption === option ? null : option));
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleMindrootsClick = () => {
    setIsMenuExpanded(prev => !prev);
  };

  const handleMouseDown = () => {
    holdTimeout.current = setTimeout(() => {
      navigate('/mindroots');
    }, 1000);
  };

  const handleMouseUp = () => {
    clearTimeout(holdTimeout.current);
  };

  const handleToggleDisplayMode = () => {
    setIsGraphMode((prevMode) => !prevMode);
  };

  const renderContent = () => {
    if (selectedOption === 'settings') {
      return (
        <div className="content-container">
          {/* Text Settings Section */}
          <div
            className="collapsible-section"
            onClick={() => setShowTextSettings((prev) => !prev)}
            style={{ cursor: 'pointer', marginBottom: '10px' }}
          >
            Text Settings
            <FontAwesomeIcon icon={showTextSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
          </div>
          {showTextSettings && (
            <>
              <TextLayoutToggle />
              <HighlightController />
            </>
          )}
  
          {/* Filter and Context Control Section */}
          <div
            className="collapsible-section"
            onClick={() => setShowFilterSettings((prev) => !prev)}
            style={{ cursor: 'pointer', marginBottom: '10px' }}
          >
            Filter and Context Control
            <FontAwesomeIcon icon={showFilterSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
          </div>
          {showFilterSettings && (
            <>
              <ContextShiftSelector />
              <FilterController />
            </>
          )}
  
          {/* Other Settings Section */}
          <div
            className="collapsible-section"
            onClick={() => setShowOtherSettings((prev) => !prev)}
            style={{ cursor: 'pointer', marginBottom: '10px' }}
          >
            Other Settings
            <FontAwesomeIcon icon={showOtherSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
          </div>
          {showOtherSettings && (
            <>
              <NodeLimitSlider />
              <WordShadeSelector />
            </>
          )}
  
          {/* Links Section at the Bottom */}
          <div className="settings-links" style={{ marginTop: '20px' }}>
            <button className="small-icon-button" onClick={() => toggleOption('about')}>
              <FontAwesomeIcon icon={faInfoCircle} />
            </button>
            <button className="small-icon-button" onClick={() => toggleOption('changelog')}>
              <FontAwesomeIcon icon={faNewspaper} />
            </button>
            {/* Display Mode Toggle Button */}
            <DisplayModeSelector />
          </div>
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
        .then((res) => res.text())
        .then((text) => setMarkdownContent(text));
    } else if (selectedOption === 'changelog') {
      fetch(changelogContent)
        .then((res) => res.text())
        .then((text) => setMarkdownContent(text));
    }
  }, [selectedOption]);

  return (
    <div>
      <div className="menu-container">
        {isMenuExpanded && (
          <>
            <button className="menu-button" onClick={() => handleNavigation('/sandbox')}>
              <FontAwesomeIcon icon={faSearch} />
            </button>
            <button className="menu-button" onClick={() => handleNavigation('/start')}>
              <FontAwesomeIcon icon={faMapMarked} />
            </button>
            <button className="menu-button" onClick={() => handleNavigation('/corpus-menu')}>
              <FontAwesomeIcon icon={faBook} />
            </button>
            <button className={`menu-button ${selectedOption === 'settings' ? 'active' : ''}`} onClick={() => toggleOption('settings')}>
              <FontAwesomeIcon icon={faGlobe} />
            </button>
          </>
        )}

        {/* Mindroots button with hold-to-navigate and click-to-toggle functionality */}
        <a
          href="/mindroots"
          className="mindroots-button"
          onClick={(e) => {
            e.preventDefault();
            handleMindrootsClick();
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img src={`${process.env.PUBLIC_URL}/root-tree.jpeg`} alt="Mindroots" className="button-icon" />
          <FontAwesomeIcon icon={isMenuExpanded ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
        </a>
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default MiniMenu;