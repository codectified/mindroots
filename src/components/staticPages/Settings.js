import React from 'react';
import DualFontScaleSelector from '../selectors/DualFontScaleSelector';
import { useNavigate } from 'react-router-dom';
import { useLabels } from '../../hooks/useLabels';
import { useSettings } from '../../contexts/SettingsContext';
import clsx from 'clsx';

const arabicFonts = [
  {
    id: 'amiri',
    name: 'Amiri',
    description: 'Classic Arabic serif — elegant and traditional',
    sample: 'ٱلْخَبِيرُ',
    fontFamily: "'Amiri', serif"
  },
  {
    id: 'noto',
    name: 'Noto Naskh Arabic',
    description: 'Modern serif — consistent with Latin typography',
    sample: 'ٱلْخَبِيرُ',
    fontFamily: "'Noto Naskh Arabic', serif"
  },
  {
    id: 'kufi',
    name: 'Noto Kufi Arabic',
    description: 'Contemporary sans-serif — clean and geometric',
    sample: 'ٱلْخَبِيرُ',
    fontFamily: "'Noto Kufi Arabic', sans-serif"
  },
];

const latinFonts = [
  {
    id: 'serif',
    name: 'Noto Serif',
    description: 'Classic serif — scholarly and readable',
    sample: 'Arabic Morphology',
    fontFamily: "'Noto Serif', Georgia, serif"
  },
  {
    id: 'sans',
    name: 'System Sans-Serif',
    description: 'Clean sans-serif — matches your device UI',
    sample: 'Arabic Morphology',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
];

const FontSelector = ({ fonts, activeId, onChange, accentClass, activeBg, activeBorder }) => (
  <div className="flex flex-col gap-4">
    {fonts.map((font) => (
      <label
        key={font.id}
        className={clsx(
          'flex items-start gap-3 cursor-pointer p-3 rounded-md transition-all duration-200',
          activeId === font.id
            ? `border-2 ${activeBorder} ${activeBg}`
            : 'border border-[#e0e0e0] bg-[#fafafa]'
        )}
      >
        <input
          type="radio"
          name={`font-${accentClass}`}
          value={font.id}
          checked={activeId === font.id}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 cursor-pointer min-w-[18px]"
        />
        <div className="flex-1">
          <div className="font-semibold text-primary mb-1">{font.name}</div>
          <div className="text-[0.85rem] text-[#666] mb-2">{font.description}</div>
          <div
            className="text-[1.4rem] text-[#333] py-1"
            style={{ fontFamily: font.fontFamily }}
          >
            {font.sample}
          </div>
        </div>
      </label>
    ))}
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const t = useLabels();
  const { arabicFont, setArabicFont, latinFont, setLatinFont } = useSettings();

  return (
    <div>
      <h2>{t.typographySettings}</h2>
      <p className="text-[#666] mb-6">
        Adjust font sizes and styles across the application. Changes are applied instantly and affect the entire UI.
      </p>

      {/* Font Size Controls */}
      <div className="settings-section">
        <h3>{t.fontSizeControl}</h3>
        <p className="text-[#666] text-[0.9rem] mb-[15px]">
          The English size scales all UI text globally (buttons, menus, headings). Arabic size scales Arabic text independently.
        </p>
        <DualFontScaleSelector />
      </div>

      {/* English Font Family */}
      <div className="settings-section">
        <h3>English Font Style</h3>
        <p className="text-[#666] text-[0.95rem] mb-[15px]">
          Choose the font used for all English UI text, labels, and headings:
        </p>
        <FontSelector
          fonts={latinFonts}
          activeId={latinFont}
          onChange={setLatinFont}
          accentClass="latin"
          activeBg="bg-accent-light"
          activeBorder="border-accent"
        />
        <p className="mt-4 text-[0.85rem] text-[#999]">{t.savedAutomatically}</p>
      </div>

      {/* Arabic Font Family */}
      <div className="settings-section">
        <h3>{t.arabicFontStyle}</h3>
        <p className="text-[#666] text-[0.95rem] mb-[15px]">
          Choose your preferred Arabic typography style:
        </p>
        <FontSelector
          fonts={arabicFonts}
          activeId={arabicFont}
          onChange={setArabicFont}
          accentClass="arabic"
          activeBg="bg-arabic-light"
          activeBorder="border-arabic"
        />
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
