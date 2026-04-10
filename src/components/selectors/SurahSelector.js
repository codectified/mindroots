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
    setSurahFilter(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const clearAll = () => setSurahFilter([]);
  const selectAll = () => setSurahFilter(SURAHS.map(s => s.number));

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#444' }}>{t.surahLabel}</span>
        <button
          onClick={clearAll}
          style={{ fontSize: '11px', padding: '2px 6px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '3px', background: '#f8f8f8', color: '#333' }}
        >
          {t.surahNone}
        </button>
        <button
          onClick={selectAll}
          style={{ fontSize: '11px', padding: '2px 6px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '3px', background: '#f8f8f8', color: '#333' }}
        >
          {t.surahAll}
        </button>
        {surahFilter.length > 0 && (
          <span style={{ fontSize: '11px', color: '#666' }}>{t.surahSelected(surahFilter.length)}</span>
        )}
      </div>
      <div style={{
        maxHeight: '160px',
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '4px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1px',
        fontSize: '12px',
      }}>
        {SURAHS.map(surah => {
          const selected = surahFilter.includes(surah.number);
          return (
            <label
              key={surah.number}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 4px',
                cursor: 'pointer',
                borderRadius: '2px',
                background: selected ? '#e8f0fe' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(surah.number)}
                style={{ width: '12px', height: '12px', cursor: 'pointer' }}
              />
              <span style={{ color: '#333', direction: showArabic ? 'rtl' : 'ltr' }}>
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
