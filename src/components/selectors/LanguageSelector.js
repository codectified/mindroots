import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';
import { useLabels } from '../../hooks/useLabels';

const LanguageSelector = () => {
  const { L1, setL1, L2, setL2 } = useLanguage();
  const { isAdvancedMode } = useAdvancedMode();
  const t = useLabels();

  return (
    <div>
      <div className="selector-row">
        <div className="selector-pair">
          <label>{t.l1Label}</label>
          <select
            className="uniform-select"
            value={L1}
            onChange={(e) => setL1(e.target.value)}
          >
            <option value="sem">{t.semitic}</option>
            <option value="english">{t.english}</option>
          </select>
        </div>

        {/* Only show L2 in Advanced Mode */}
        {isAdvancedMode && (
          <div className="selector-pair">
            <label>{t.l2Label}</label>
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
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;