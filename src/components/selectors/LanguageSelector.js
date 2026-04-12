import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLabels } from '../../hooks/useLabels';

const LanguageSelector = () => {
  const { L1, setL1 } = useLanguage();
  const t = useLabels();

  return (
    <div className="selector-row">
      <div className="selector-pair">
        <label>{t.languageLabel}</label>
        <select
          className="uniform-select"
          value={L1}
          onChange={(e) => setL1(e.target.value)}
        >
          <option value="sem">{t.semitic}</option>
          <option value="arabic">{t.arabic}</option>
          <option value="english">{t.english}</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
