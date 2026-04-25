import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faChevronDown, faChevronUp, faMapMarked, faSearch, faHome, faSliders } from '@fortawesome/free-solid-svg-icons';
import LanguageSelector from '../selectors/LanguageSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import NodeLimitSlider from '../selectors/NodeLimitSlider';
import FilterController from '../selectors/FilterController';
import SemiticLanguageFilter from '../selectors/SemiticLanguageFilter';
import WordShadeSelector from '../selectors/WordShadeSelector';
import DisplayModeSelector from '../selectors/DisplayModeSelector';
import ModeSelector from '../selectors/ModeSelector';
import ShowLinksToggle from '../selectors/ShowLinksToggle';
import FontScaleSelector from '../selectors/FontScaleSelector';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLabels } from '../../hooks/useLabels';

const MiniMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdvancedMode } = useAdvancedMode();
  const { L1, L2, setL2 } = useLanguage();
  const t = useLabels();
  const [selectedOption, setSelectedOption] = useState(null);
  const [setIsGraphMode] = useState(false); // Toggle for Graph/Table mode
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [showGraphSettings, setShowGraphSettings] = useState(false);
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
          {/* Collapse button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <button
              onClick={() => toggleOption('settings')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#888', padding: '0 4px', lineHeight: 1 }}
              title={t.collapseMenu}
            >
              {t.collapseMenu}
            </button>
          </div>

          {/* 1. Language Control - Always visible */}
          <div style={{ marginBottom: '10px' }}>
            <LanguageSelector />
          </div>

          {/* 2. Mode Selection - Always visible */}
          <div style={{ marginBottom: '10px' }}>
            <ModeSelector />
          </div>

          {/* Advanced Mode Only Sections */}
          {isAdvancedMode && (
            <>
              {/* 3. General */}
              <div
                className="font-semibold font-serif text-[#333] text-[14px]"
                onClick={() => setShowOtherSettings((prev) => !prev)}
                style={{ cursor: 'pointer', marginBottom: '10px' }}
              >
                {t.general}
                <FontAwesomeIcon icon={showOtherSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
              </div>
              {showOtherSettings && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <FontScaleSelector />
                  </div>
                  <button
                    onClick={() => navigate('/settings')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      marginBottom: '15px',
                      backgroundColor: '#f0f7fd',
                      border: '1px solid #bfe7fd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#2c7fb8',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e3f2fd';
                      e.target.style.borderColor = '#2c7fb8';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f0f7fd';
                      e.target.style.borderColor = '#bfe7fd';
                    }}
                  >
                    <FontAwesomeIcon icon={faSliders} />
                    {t.advancedTypography}
                  </button>
                  <WordShadeSelector />
                </>
              )}

              {/* 4. Graph */}
              <div
                className="font-semibold font-serif text-[#333] text-[14px]"
                onClick={() => setShowGraphSettings((prev) => !prev)}
                style={{ cursor: 'pointer', marginBottom: '10px' }}
              >
                {t.graph}
                <FontAwesomeIcon icon={showGraphSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
              </div>
              {showGraphSettings && (
                <>
                  <ContextShiftSelector />
                  <div style={{ marginBottom: '10px' }}>
                    <div className="selector-pair">
                      <label>{t.secondaryLanguage}</label>
                      <select
                        className="uniform-select"
                        value={L2}
                        onChange={(e) => setL2(e.target.value)}
                      >
                        <option value="off">{t.off}</option>
                        <option value="sem">{t.semitic}</option>
                        <option value="english">{t.english}</option>
                      </select>
                    </div>
                  </div>
                  <ShowLinksToggle />
                  <NodeLimitSlider />
                </>
              )}

              {/* 5. Filters */}
              <div
                className="font-semibold font-serif text-[#333] text-[14px]"
                onClick={() => setShowFilterSettings((prev) => !prev)}
                style={{ cursor: 'pointer', marginBottom: '10px' }}
              >
                {t.filters}
                <FontAwesomeIcon icon={showFilterSettings ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
              </div>
              {showFilterSettings && (
                <>
                  <FilterController />
                  {L1 !== 'arabic' && <SemiticLanguageFilter />}
                </>
              )}

            </>
          )}

          {/* Links Section at the Bottom - removed buttons that moved to vertical stack */}
          <div className="flex flex-row gap-[10px] ml-auto items-end mt-5">
            {/* Buttons moved to vertical stack under Mindroots button */}
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="fixed bottom-5 left-5 flex flex-row-reverse items-center gap-2.5 h-[60px] z-[1000] md:absolute md:bottom-auto md:left-auto md:top-5 md:right-5 md:flex-row">
        {isMenuExpanded && (
          <>
            <button className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-[#333] text-white cursor-pointer border-none text-[14px] p-[6px] hover:bg-[#555] xs:text-[16px] xs:p-2 md:text-[20px] md:p-0" onClick={() => handleNavigation('/sandbox')}>
              <FontAwesomeIcon icon={faSearch} />
            </button>
            <button className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-[#333] text-white cursor-pointer border-none text-[14px] p-[6px] hover:bg-[#555] xs:text-[16px] xs:p-2 md:text-[20px] md:p-0" onClick={() => handleNavigation('/start')}>
              <FontAwesomeIcon icon={faMapMarked} />
            </button>
            <button className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-[#333] text-white cursor-pointer border-none text-[14px] p-[6px] hover:bg-[#555] xs:text-[16px] xs:p-2 md:text-[20px] md:p-0" onClick={() => handleNavigation('/corpus-menu')}>
              <FontAwesomeIcon icon={faBookOpen} />
            </button>
            <button className={`w-[50px] h-[50px] flex items-center justify-center rounded-full text-white cursor-pointer border-none text-[14px] p-[6px] xs:text-[16px] xs:p-2 md:text-[20px] md:p-0 hover:bg-[#555] ${selectedOption === 'settings' ? 'bg-[#4a4a4a]' : 'bg-[#333]'}`} onClick={() => toggleOption('settings')}>
              <FontAwesomeIcon icon={faGlobe} />
            </button>
          </>
        )}

        {/* Mindroots button with hold-to-navigate and click-to-toggle functionality */}
        <a
          href="/mindroots"
          className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-transparent cursor-pointer overflow-hidden relative border-none"
          onClick={(e) => {
            e.preventDefault();
            handleMindrootsClick();
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img src={`${process.env.PUBLIC_URL}/root-tree.jpeg`} alt="Mindroots" className="w-full h-full object-cover absolute top-0 left-0" />
          <FontAwesomeIcon icon={isMenuExpanded ? faChevronUp : faChevronDown} style={{ marginLeft: '5px' }} />
        </a>
      </div>

      {/* Vertical button stack under Mindroots button */}
      {isMenuExpanded && (
        <div className="fixed bottom-[80px] left-[30px] flex flex-col-reverse gap-[10px] z-[1000] items-center md:absolute md:top-[80px] md:right-[30px] md:bottom-auto md:left-auto md:flex-col">
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
        <div className="fixed bottom-[80px] left-5 bg-white/95 border border-[#ccc] rounded-[8px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[1002] min-w-[300px] max-w-[400px] max-h-[70vh] overflow-y-auto md:absolute md:top-[80px] md:right-5 md:bottom-auto md:left-auto">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default MiniMenu;
