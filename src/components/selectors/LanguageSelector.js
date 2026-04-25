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
          className="py-[5px] px-2 text-base font-serif min-w-[120px] border border-border rounded bg-white text-ink appearance-none focus:outline-none focus:border-muted"
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
