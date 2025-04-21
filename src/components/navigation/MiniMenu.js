import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faChevronDown, faChevronUp, faBook, faMapMarked, faSearch, faHome } from '@fortawesome/free-solid-svg-icons';
import LanguageSelector from '../selectors/LanguageSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import NodeLimitSlider from '../selectors/NodeLimitSlider';
import HighlightController from '../selectors/HighlightController';
import TextLayoutToggle from '../selectors/TextLayoutSelector';
import FilterController from '../selectors/FilterController';
import WordShadeSelector from '../selectors/WordShadeSelector';
import DisplayModeSelector from '../selectors/DisplayModeSelector';
import { useNavigate, useLocation } from 'react-router-dom';

const MiniMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [showTextSettings, setShowTextSettings] = useState(false);
  const [setIsGraphMode] = useState(false); // Toggle for Graph/Table mode
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

  const renderContent = () => {
    if (selectedOption === 'settings') {
      return (
        <div className="content-container">
          {/* Language Selector at the Top */}
          <div style={{ marginBottom: '10px' }}>
            <LanguageSelector />
          </div>
  
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
<div className="settings-links" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
  <button className="small-icon-button" onClick={() => handleNavigation('/mindroots')}>
    <FontAwesomeIcon icon={faHome} />
  </button>
  
  {/* Display Mode Toggle Button */}
  <DisplayModeSelector />
</div>
</div>
      );
    }
  };

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