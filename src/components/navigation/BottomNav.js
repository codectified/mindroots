import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faMapMarked, faSearch, faChevronDown, faChevronUp, faSliders, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import LanguageSelector from '../selectors/LanguageSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import NodeLimitSlider from '../selectors/NodeLimitSlider';
import FilterController from '../selectors/FilterController';
import SemiticLanguageFilter from '../selectors/SemiticLanguageFilter';
import WordShadeSelector from '../selectors/WordShadeSelector';
import ModeSelector from '../selectors/ModeSelector';
import ShowLinksToggle from '../selectors/ShowLinksToggle';
import DualFontScaleSelector from '../selectors/DualFontScaleSelector';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLabels } from '../../hooks/useLabels';
import clsx from 'clsx';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdvancedMode } = useAdvancedMode();
  const { L1, L2, setL2 } = useLanguage();
  const t = useLabels();
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [showGraphSettings, setShowGraphSettings] = useState(false);
  const [showOtherSettings, setShowOtherSettings] = useState(false);
  const holdTimeout = useRef(null);
  const tapCount = useRef(0);
  const tapTimeout = useRef(null);

  if (location.pathname === '/' || location.pathname === '/mindroots') {
    return null;
  }

  const handleNavigation = (path) => navigate(path);
  const handleSettingsToggle = () => setShowSettings(!showSettings);

  const handleMindRootsClick = (e) => {
    e.preventDefault();
    tapCount.current += 1;
    if (tapCount.current === 1) {
      tapTimeout.current = setTimeout(() => {
        tapCount.current = 0;
        setIsExpanded(!isExpanded);
      }, 300);
    } else if (tapCount.current === 2) {
      clearTimeout(tapTimeout.current);
      tapCount.current = 0;
      navigate('/mindroots');
    }
  };

  const handleMouseDown = () => {
    holdTimeout.current = setTimeout(() => navigate('/mindroots'), 1000);
  };
  const handleMouseUp = () => clearTimeout(holdTimeout.current);

  return (
    <>
      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed left-0 right-0 bottom-[70px] bg-[rgba(255,255,255,0.97)] backdrop-blur-[15px] border-t border-black/10 max-h-[50vh] overflow-y-auto z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] md:bottom-[65px] xs:bottom-[60px]">
          <div className="p-5 max-w-[800px] mx-auto">

            {/* Collapse button */}
            <div className="flex justify-end mb-1">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-transparent border-none cursor-pointer text-lg text-[#888] px-1 leading-none"
                title={t.collapseMenu}
              >
                {t.collapseMenu}
              </button>
            </div>

            {/* Always-visible controls */}
            <div className="mb-4"><LanguageSelector /></div>
            <div className="mb-4"><ModeSelector /></div>

            {/* Advanced mode controls */}
            {isAdvancedMode && (
              <>
                {/* General section */}
                <div
                  className="flex justify-between items-center text-[#333] font-semibold select-none cursor-pointer mb-2.5 py-2 border-b border-black/10"
                  onClick={() => setShowOtherSettings(prev => !prev)}
                >
                  <strong>{t.general}</strong>
                  <FontAwesomeIcon icon={showOtherSettings ? faChevronUp : faChevronDown} className="ml-1.5" />
                </div>
                {showOtherSettings && (
                  <div className="mb-4 pl-2.5">
                    <div className="mb-4"><DualFontScaleSelector /></div>
                    <button
                      onClick={() => navigate('/settings')}
                      className="flex items-center gap-2 px-3 py-2 mb-4 bg-[#f0f7fd] border border-[#bfe7fd] rounded cursor-pointer text-accent font-medium text-[0.9rem] transition-all duration-200 w-full hover:bg-accent-light hover:border-accent"
                    >
                      <FontAwesomeIcon icon={faSliders} />
                      {t.advancedTypography}
                    </button>
                    <WordShadeSelector />
                  </div>
                )}

                {/* Graph section */}
                <div
                  className="flex justify-between items-center text-[#333] font-semibold select-none cursor-pointer mb-2.5 py-2 border-b border-black/10"
                  onClick={() => setShowGraphSettings(prev => !prev)}
                >
                  <strong>{t.graph}</strong>
                  <FontAwesomeIcon icon={showGraphSettings ? faChevronUp : faChevronDown} className="ml-1.5" />
                </div>
                {showGraphSettings && (
                  <div className="mb-4 pl-2.5">
                    <ContextShiftSelector />
                    <div className="mb-2.5">
                      <div className="flex items-center gap-[5px] whitespace-nowrap">
                        <label>{t.secondaryLanguage}</label>
                        <select
                          className="py-[5px] px-2 text-base font-serif min-w-[120px] border border-border rounded bg-white text-[#333] appearance-none focus:outline-none focus:border-muted"
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
                  </div>
                )}

                {/* Filters section */}
                <div
                  className="flex justify-between items-center text-[#333] font-semibold select-none cursor-pointer mb-2.5 py-2 border-b border-black/10"
                  onClick={() => setShowFilterSettings(prev => !prev)}
                >
                  <strong>{t.filters}</strong>
                  <FontAwesomeIcon icon={showFilterSettings ? faChevronUp : faChevronDown} className="ml-1.5" />
                </div>
                {showFilterSettings && (
                  <div className="mb-4 pl-2.5">
                    <FilterController />
                    {L1 !== 'arabic' && <SemiticLanguageFilter />}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 flex justify-center items-center z-modal',
          'bg-[rgba(40,40,40,0.95)] backdrop-blur-sm border-t border-white/10',
          'shadow-[0_-2px_10px_rgba(0,0,0,0.2)] transition-all duration-300',
          isExpanded ? 'h-[70px] px-5 gap-4' : 'h-[60px] px-0 gap-0'
        )}
      >
        {/* Left buttons */}
        {isExpanded && (
          <div className="flex items-center gap-4 md:gap-3 xs:gap-2">
            <button
              className={clsx(
                'w-[50px] h-[50px] rounded-full border border-white/20 text-white',
                'flex items-center justify-center cursor-pointer text-[18px] transition-all duration-300',
                'bg-white/10 hover:bg-white/20 hover:-translate-y-0.5',
                'md:w-[45px] md:h-[45px] md:text-base xs:w-[40px] xs:h-[40px] xs:text-sm',
                showSettings && 'bg-[rgba(75,150,225,0.7)] border-[rgba(75,150,225,1)]'
              )}
              onClick={handleSettingsToggle}
              title={t.general}
            >
              <FontAwesomeIcon icon={faGlobe} />
            </button>
            <button
              className="w-[50px] h-[50px] rounded-full border border-white/20 text-white flex items-center justify-center cursor-pointer text-[18px] transition-all duration-300 bg-white/10 hover:bg-white/20 hover:-translate-y-0.5"
              onClick={() => handleNavigation('/corpus-menu')}
              title={t.corpusLibrary}
            >
              <FontAwesomeIcon icon={faBookOpen} />
            </button>
          </div>
        )}

        {/* Center: MindRoots button — always visible */}
        <button
          className="w-[55px] h-[55px] rounded-full bg-white border-[3px] border-white/30 cursor-pointer flex items-center justify-center overflow-hidden transition-all duration-300 relative p-0.5 hover:-translate-y-[3px] hover:shadow-[0_5px_20px_rgba(0,0,0,0.3)]"
          onClick={handleMindRootsClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          title="Tap to expand, Double-tap for Home"
        >
          <img
            src={`${process.env.PUBLIC_URL}/root-tree.jpeg`}
            alt="MindRoots"
            className="w-full h-full object-cover object-center rounded-full block"
          />
        </button>

        {/* Right buttons */}
        {isExpanded && (
          <div className="flex items-center gap-4 md:gap-3 xs:gap-2">
            <button
              className="w-[50px] h-[50px] rounded-full border border-white/20 text-white flex items-center justify-center cursor-pointer text-[18px] transition-all duration-300 bg-white/10 hover:bg-white/20 hover:-translate-y-0.5"
              onClick={() => handleNavigation('/start')}
              title={t.graphExploration}
            >
              <FontAwesomeIcon icon={faMapMarked} />
            </button>
            <button
              className="w-[50px] h-[50px] rounded-full border border-white/20 text-white flex items-center justify-center cursor-pointer text-[18px] transition-all duration-300 bg-white/10 hover:bg-white/20 hover:-translate-y-0.5"
              onClick={() => handleNavigation('/sandbox')}
              title={t.positionalRootSearch}
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
