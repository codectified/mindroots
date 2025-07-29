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
import ModeSelector from '../selectors/ModeSelector';
import ShowLinksToggle from '../selectors/ShowLinksToggle';
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

          {/* Mode Selector */}
          <ModeSelector />
  
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
              <ShowLinksToggle />
            </>
          )}
  
{/* Links Section at the Bottom - removed buttons that moved to vertical stack */}
<div className="settings-links" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
  {/* Buttons moved to vertical stack under Mindroots button */}
</div>
</div>
      );
    }
  };

  return (
    <div style={{ position: 'relative' }}>
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
      
      {/* Vertical button stack under Mindroots button */}
      {isMenuExpanded && (
        <div className="vertical-button-stack">
          <button 
            className="mini-menu-button" 
            onClick={() => handleNavigation('/mindroots')}
            style={{
              width: '30px',
              height: '30px',
              minWidth: '30px',
              minHeight: '30px',
              maxWidth: '30px',
              maxHeight: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: '#333',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              border: 'none',
              transition: 'background-color 0.2s',
              padding: '0',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#555'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
          >
            <FontAwesomeIcon icon={faHome} />
          </button>
          
          <DisplayModeSelector />
        </div>
      )}
      
      {/* Settings panel */}
      {selectedOption && (
        <div className="settings-panel">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default MiniMenu;