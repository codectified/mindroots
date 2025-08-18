import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';

const LanguageSelector = () => {
  const { L1, setL1, L2, setL2 } = useLanguage();
  const { isAdvancedMode } = useAdvancedMode();

  return (
    <div>
      <div className="selector-row">
        <div className="selector-pair">
          <label>L1:</label>
          <select
            className="uniform-select"
            value={L1}
            onChange={(e) => setL1(e.target.value)}
          >
            <option value="sem">Semitic</option>
            <option value="english">English</option>
          </select>
        </div>

        {/* Only show L2 in Advanced Mode */}
        {isAdvancedMode && (
          <div className="selector-pair">
            <label>L2:</label>
            <select
              className="uniform-select"
              value={L2}
              onChange={(e) => setL2(e.target.value)}
            >
              <option value="off">Off</option>
              <option value="sem">Semitic</option>
              <option value="english">English</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;