import React, { createContext, useContext, useState } from 'react';
import { useLabels } from '../../hooks/useLabels';

const ShowLinksContext = createContext();

export const ShowLinksProvider = ({ children }) => {
  const [showLinks, setShowLinks] = useState(true);
  const [showLinkLabels, setShowLinkLabels] = useState(false);

  return (
    <ShowLinksContext.Provider value={{ showLinks, setShowLinks, showLinkLabels, setShowLinkLabels }}>
      {children}
    </ShowLinksContext.Provider>
  );
};

export const useShowLinks = () => {
  const context = useContext(ShowLinksContext);
  if (!context) throw new Error('useShowLinks must be used within a ShowLinksProvider');
  return context;
};

const ShowLinksToggle = () => {
  const { showLinks, setShowLinks, showLinkLabels, setShowLinkLabels } = useShowLinks();
  const t = useLabels();

  const toggleBtnCls = (active, disabled = false) =>
    `py-1 px-3 text-[12px] rounded border border-border font-serif transition-colors ` +
    (disabled ? 'cursor-not-allowed opacity-50 ' : 'cursor-pointer ') +
    (active ? 'bg-ink text-white' : 'bg-surface text-ink');

  return (
    <div className="mb-[10px]">
      <div className="flex gap-[5px] mb-[5px]">
        <button
          className={toggleBtnCls(showLinks)}
          onClick={() => setShowLinks(!showLinks)}
        >
          {t.showLinks}
        </button>
      </div>
      <div className="flex gap-[5px]">
        <button
          className={toggleBtnCls(showLinkLabels && showLinks, !showLinks)}
          onClick={() => setShowLinkLabels(!showLinkLabels)}
          disabled={!showLinks}
        >
          {t.showLinkLabels}
        </button>
      </div>
    </div>
  );
};

export default ShowLinksToggle;
