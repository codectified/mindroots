import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLabels } from '../../hooks/useLabels';

const LanguageSelector = () => {
  const { L1, setL1 } = useLanguage();
  const t = useLabels();

  return (
    <div className="flex flex-wrap items-center gap-x-[15px] gap-y-0.5">
      <div className="flex items-center gap-[5px] whitespace-nowrap">
        <label>{t.languageLabel}</label>
        <select
          className="select-ui"
          value={L1}
          onChange={(e) => setL1(e.target.value)}
        >
          <option value="sem">Semitic</option>
          <option value="arabic">العربية</option>
          <option value="english">English</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
