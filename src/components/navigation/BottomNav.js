import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faMapMarked, faSearch, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { RiBookShelfLine } from 'react-icons/ri';
import LanguageSelector from '../selectors/LanguageSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import NodeLimitSlider from '../selectors/NodeLimitSlider';
import FilterController from '../selectors/FilterController';
import SemiticLanguageFilter from '../selectors/SemiticLanguageFilter';
import WordShadeSelector from '../selectors/WordShadeSelector';
import ModeSelector from '../selectors/ModeSelector';
import ShowLinksToggle from '../selectors/ShowLinksToggle';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdvancedMode } = useAdvancedMode();
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [showContextSettings, setShowContextSettings] = useState(false);
  const [showOtherSettings, setShowOtherSettings] = useState(false);
  const holdTimeout = useRef(null);
  const tapCount = useRef(0);
  const tapTimeout = useRef(null);

  // Don't show on homepage or main menu
  if (location.pathname === '/' || location.pathname === '/mindroots') {
    return null;
  }

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSettingsToggle = () => {
    setShowSettings(!showSettings);
  };

  // Single-tap expands/collapses, double-tap goes home
  const handleMindRootsClick = (e) => {
    e.preventDefault();
    tapCount.current += 1;

    if (tapCount.current === 1) {
      tapTimeout.current = setTimeout(() => {
        tapCount.current = 0;
        // Single tap - toggle expansion
        setIsExpanded(!isExpanded);
      }, 300);
    } else if (tapCount.current === 2) {
      clearTimeout(tapTimeout.current);
      tapCount.current = 0;
      // Double tap - navigate to home
      navigate('/mindroots');
    }
  };

  // Hold to navigate (optional secondary interaction)
  const handleMouseDown = () => {
    holdTimeout.current = setTimeout(() => {
      navigate('/mindroots');
    }, 1000);
  };

  const handleMouseUp = () => {
    clearTimeout(holdTimeout.current);
  };

  return (
    <>
      {/* Settings Panel */}
      {showSettings && (
        <div className="bottom-settings-panel">
          <div className="settings-content">
            {/* Always visible controls */}
            <div style={{ marginBottom: '15px' }}>
              <LanguageSelector />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <ModeSelector />
            </div>

            {/* Advanced mode controls with proper groupings */}
            {isAdvancedMode && (
              <>
                {/* General Section */}
                <div
                  className="collapsible-section"
                  onClick={() => setShowOtherSettings((prev) => !prev)}
                  style={{ cursor: 'pointer', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
                >
                  <strong>General</strong>
                  <FontAwesomeIcon icon={showOtherSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
                </div>
                {showOtherSettings && (
                  <div style={{ marginBottom: '15px', paddingLeft: '10px' }}>
                    <ShowLinksToggle />
                    <NodeLimitSlider />
                    <WordShadeSelector />
                  </div>
                )}
                
                {/* Contexts Section */}
                <div
                  className="collapsible-section"
                  onClick={() => setShowContextSettings((prev) => !prev)}
                  style={{ cursor: 'pointer', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
                >
                  <strong>Contexts</strong>
                  <FontAwesomeIcon icon={showContextSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
                </div>
                {showContextSettings && (
                  <div style={{ marginBottom: '15px', paddingLeft: '10px' }}>
                    <ContextShiftSelector />
                  </div>
                )}
        
                {/* Filters Section */}
                <div
                  className="collapsible-section"
                  onClick={() => setShowFilterSettings((prev) => !prev)}
                  style={{ cursor: 'pointer', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
                >
                  <strong>Filters</strong>
                  <FontAwesomeIcon icon={showFilterSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
                </div>
                {showFilterSettings && (
                  <div style={{ marginBottom: '15px', paddingLeft: '10px' }}>
                    <FilterController />
                    <SemiticLanguageFilter />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className={`bottom-nav ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Left buttons - only show when expanded */}
        {isExpanded && (
          <div className="nav-section nav-left">
            <button 
              className={`nav-button ${showSettings ? 'active' : ''}`} 
              onClick={handleSettingsToggle}
              title="Settings"
            >
              <FontAwesomeIcon icon={faGlobe} />
            </button>
            <button 
              className="nav-button" 
              onClick={() => handleNavigation('/corpus-menu')}
              title="Corpus Library"
            >
              <RiBookShelfLine />
            </button>
          </div>
        )}

        {/* Center: MindRoots button - always visible */}
        <button
          className="mindroots-nav-button"
          onClick={handleMindRootsClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          title="Tap to expand, Double-tap for Home"
        >
          <img src={`${process.env.PUBLIC_URL}/root-tree.jpeg`} alt="MindRoots" className="mindroots-icon" />
        </button>

        {/* Right buttons - only show when expanded */}
        {isExpanded && (
          <div className="nav-section nav-right">
            <button 
              className="nav-button" 
              onClick={() => handleNavigation('/start')}
              title="Graph Exploration"
            >
              <FontAwesomeIcon icon={faMapMarked} />
            </button>
            <button 
              className="nav-button" 
              onClick={() => handleNavigation('/sandbox')}
              title="Positional Root Search"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default BottomNav;