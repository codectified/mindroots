import React, { useState, useEffect } from 'react';
import DualFontScaleSelector from '../selectors/DualFontScaleSelector';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [arabicFont, setArabicFont] = useState(() => {
    const saved = localStorage.getItem('arabicFont');
    return saved || 'amiri';
  });

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

  useEffect(() => {
    localStorage.setItem('arabicFont', arabicFont);
    // Apply the font to document
    const fontFamilyMap = {
      amiri: "'Amiri', serif",
      noto: "'Noto Serif Arabic', serif",
      kufi: "'Noto Kufi Arabic', sans-serif",
    };
    document.documentElement.style.setProperty('--font-arabic', fontFamilyMap[arabicFont]);
  }, [arabicFont]);

  return (
    <div>
      <h2>Typography Settings</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Adjust font sizes and styles across the application. Changes are applied instantly.
      </p>

      {/* Font Size Control - Separate scales for Latin and Semitic */}
      <div className="settings-section">
        <h3>Font Size Control</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
          Control font sizes independently for English and Arabic text. Arabic text often appears smaller at the same size, so you can adjust it separately.
        </p>
        <DualFontScaleSelector />
      </div>

      {/* Font Family Control */}
      <div className="settings-section">
        <h3>Arabic Font Style</h3>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '15px' }}>
          Choose your preferred Arabic typography style. Each font has a distinct visual character:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {arabicFonts.map((font) => (
            <label
              key={font.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '6px',
                border: arabicFont === font.id ? '2px solid #2c7fb8' : '1px solid #e0e0e0',
                backgroundColor: arabicFont === font.id ? '#f0f7fd' : '#fafafa',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="radio"
                name="arabicFont"
                value={font.id}
                checked={arabicFont === font.id}
                onChange={(e) => setArabicFont(e.target.value)}
                style={{ marginTop: '2px', cursor: 'pointer', minWidth: '18px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                  {font.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                  {font.description}
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontFamily: font.fontFamily,
                    color: '#333',
                    padding: '8px 0',
                    letterSpacing: '0.05em',
                  }}
                >
                  {font.sample}
                </div>
              </div>
            </label>
          ))}
        </div>
        <p style={{ marginTop: '16px', fontSize: '0.85rem', color: '#999' }}>
          Your preferences are saved automatically.
        </p>
      </div>

      {/* Navigation */}
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f7fd', borderRadius: '6px', border: '1px solid #bfe7fd' }}>
        <p style={{ margin: '0 0 12px 0', color: '#2c3e50', fontWeight: '500' }}>
          Most settings are in the mini-menu under "General"
        </p>
        <button
          onClick={() => navigate('/start')}
          style={{
            padding: '10px 16px',
            backgroundColor: '#2c7fb8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.95rem',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2463a3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2c7fb8'}
        >
          Go to Explore
        </button>
      </div>
    </div>
  );
};

export default Settings;