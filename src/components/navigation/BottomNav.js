import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faBook, faMapMarked, faSearch, faHome } from '@fortawesome/free-solid-svg-icons';
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

  // Double-tap handler for MindReach button
  const handleMindRootsClick = (e) => {
    e.preventDefault();
    tapCount.current += 1;

    if (tapCount.current === 1) {
      tapTimeout.current = setTimeout(() => {
        tapCount.current = 0;
        // Single tap - do nothing or could collapse settings
        if (showSettings) setShowSettings(false);
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

            {/* Advanced mode controls */}
            {isAdvancedMode && (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <ShowLinksToggle />
                  <NodeLimitSlider />
                  <WordShadeSelector />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <ContextShiftSelector />
                </div>
                <div>
                  <FilterController />
                  <SemiticLanguageFilter />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="bottom-nav">
        {/* Left: Settings + Library */}
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
            <FontAwesomeIcon icon={faBook} />
          </button>
        </div>

        {/* Center: MindRoots button */}
        <div className="nav-section nav-center">
          <button
            className="mindroots-nav-button"
            onClick={handleMindRootsClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            title="Double-tap for Home"
          >
            <img src={`${process.env.PUBLIC_URL}/root-tree.jpeg`} alt="MindRoots" className="mindroots-icon" />
          </button>
        </div>

        {/* Right: Explore + Search */}
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
      </div>
    </>
  );
};

export default BottomNav;