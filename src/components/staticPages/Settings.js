import React, { useState, useEffect } from 'react';
import DualFontScaleSelector from '../selectors/DualFontScaleSelector';
import { useNavigate } from 'react-router-dom';
import { useLabels } from '../../hooks/useLabels';
import clsx from 'clsx';

const arabicFonts = [
  {
    id: 'amiri',
    name: 'Amiri',
    description: 'Classic Arabic serif font - elegant and traditional',
    sample: 'ٱلْخَبِيرُ',
    fontFamily: "'Amiri', serif"
  },
  {
    id: 'noto',
    name: 'Noto Serif Arabic',
    description: 'Modern serif font - consistent with Latin typography',
    sample: 'ٱلْخَبِيرُ',
    fontFamily: "'Noto Serif Arabic', serif"
  },
  {
    id: 'kufi',
    name: 'Noto Kufi Arabic',
    description: 'Contemporary sans-serif style - clean and geometric',
    sample: 'ٱلْخَبِيرُ',
    fontFamily: "'Noto Kufi Arabic', sans-serif"
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const t = useLabels();
  const [arabicFont, setArabicFont] = useState(() => localStorage.getItem('arabicFont') || 'amiri');

  useEffect(() => {
    localStorage.setItem('arabicFont', arabicFont);
    const fontFamilyMap = {
      amiri: "'Amiri', serif",
      noto: "'Noto Serif Arabic', serif",
      kufi: "'Noto Kufi Arabic', sans-serif",
    };
    document.documentElement.style.setProperty('--font-arabic', fontFamilyMap[arabicFont]);
  }, [arabicFont]);

  return (
    <div>
      <h2>{t.typographySettings}</h2>
      <p className="text-[#666] mb-6">
        Adjust font sizes and styles across the application. Changes are applied instantly.
      </p>

      {/* Font Size Control */}
      <div className="settings-section">
        <h3>{t.fontSizeControl}</h3>
        <p className="text-[#666] text-[0.9rem] mb-[15px]">
          Control font sizes independently for English and Arabic text. Arabic text often appears smaller at the same size, so you can adjust it separately.
        </p>
        <DualFontScaleSelector />
      </div>

      {/* Font Family Control */}
      <div className="settings-section">
        <h3>{t.arabicFontStyle}</h3>
        <p className="text-[#666] text-[0.95rem] mb-[15px]">
          Choose your preferred Arabic typography style. Each font has a distinct visual character:
        </p>
        <div className="flex flex-col gap-4">
          {arabicFonts.map((font) => (
            <label
              key={font.id}
              className={clsx(
                'flex items-start gap-3 cursor-pointer p-3 rounded-md transition-all duration-200',
                arabicFont === font.id
                  ? 'border-2 border-accent bg-accent-light'
                  : 'border border-[#e0e0e0] bg-[#fafafa]'
              )}
            >
              <input
                type="radio"
                name="arabicFont"
                value={font.id}
                checked={arabicFont === font.id}
                onChange={(e) => setArabicFont(e.target.value)}
                className="mt-0.5 cursor-pointer min-w-[18px]"
              />
              <div className="flex-1">
                <div className="font-semibold text-primary mb-1">{font.name}</div>
                <div className="text-[0.85rem] text-[#666] mb-2">{font.description}</div>
                <div
                  className="text-[1.5rem] text-[#333] py-2 tracking-[0.05em]"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {font.sample}
                </div>
              </div>
            </label>
          ))}
        </div>
        <p className="mt-4 text-[0.85rem] text-[#999]">{t.savedAutomatically}</p>
      </div>

      {/* Navigation */}
      <div className="mt-6 p-4 bg-accent-light rounded-md border border-[#bfe7fd]">
        <p className="m-0 mb-3 text-primary font-medium">
          Most settings are in the mini-menu under "General"
        </p>
        <button
          onClick={() => navigate('/start')}
          className="px-4 py-[10px] bg-accent text-white border-none rounded cursor-pointer font-medium text-[0.95rem] transition-colors duration-200 hover:bg-accent-hover"
        >
          {t.goToExplore}
        </button>
      </div>
    </div>
  );
};

export default Settings;
