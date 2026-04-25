import React from 'react';
import { useCorpusFilter } from '../../contexts/CorpusFilterContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SURAHS, toArabicNumerals } from '../../constants/surahs';
import { useLabels } from '../../hooks/useLabels';

const SurahSelector = () => {
  const { corpusFilter, surahFilter, setSurahFilter } = useCorpusFilter();
  const { L1 } = useLanguage();
  const showArabic = L1 === 'sem';
  const t = useLabels();

  if (corpusFilter !== 2 && corpusFilter !== '2') return null;

  const toggle = (num) => {
    setSurahFilter(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const clearAll = () => setSurahFilter([]);
  const selectAll = () => setSurahFilter(SURAHS.map(s => s.number));

  const smallBtnCls = 'text-[11px] py-[2px] px-[6px] cursor-pointer border border-[#ccc] rounded-[3px] bg-[#f8f8f8] text-[#333]';

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[13px] font-bold text-[#444]">{t.surahLabel}</span>
        <button onClick={clearAll} className={smallBtnCls}>{t.surahNone}</button>
        <button onClick={selectAll} className={smallBtnCls}>{t.surahAll}</button>
        {surahFilter.length > 0 && (
          <span className="text-[11px] text-muted">{t.surahSelected(surahFilter.length)}</span>
        )}
      </div>
      <div className="max-h-[160px] overflow-y-auto border border-[#ddd] rounded p-1 grid grid-cols-2 gap-px text-[12px]">
        {SURAHS.map(surah => {
          const selected = surahFilter.includes(surah.number);
          return (
            <label
              key={surah.number}
              className={`flex items-center gap-1 py-[2px] px-1 cursor-pointer rounded-[2px] ${selected ? 'bg-[#e8f0fe]' : 'bg-transparent'}`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(surah.number)}
                className="w-3 h-3 cursor-pointer"
              />
              {/* direction has no Tailwind utility — stays inline */}
              <span className="text-[#333]" style={{ direction: showArabic ? 'rtl' : 'ltr' }}>
                {showArabic ? toArabicNumerals(surah.number) : surah.number}. {showArabic ? surah.arabic : surah.english}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default SurahSelector;
