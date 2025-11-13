import React, { useState, useEffect } from 'react';
import FontScaleSelector from '../selectors/FontScaleSelector';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [arabicFont, setArabicFont] = useState(() => {
    const saved = localStorage.getItem('arabicFont');
    return saved || 'amiri';
  });

  const arabicFonts = [
    { id: 'amiri', name: 'Amiri', value: 'amiri' },
    { id: 'noto', name: 'Noto Serif Arabic', value: 'noto' },
    { id: 'kufi', name: 'Noto Kufi Arabic', value: 'kufi' },
  ];

  useEffect(() => {
    localStorage.setItem('arabicFont', arabicFont);
    // Apply the font to document
    const fontFamilyMap = {
      amiri: "'Amiri', 'Arabic Typesetting', serif",
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

      {/* Font Size Control */}
      <div className="settings-section">
        <h3>Font Size Control</h3>
        <FontScaleSelector />
      </div>

      {/* Font Family Control */}
      <div className="settings-section">
        <h3>Arabic Font Style</h3>
        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '15px' }}>
          Choose your preferred Arabic typography style:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {arabicFonts.map((font) => (
            <label key={font.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '0' }}>
              <input
                type="radio"
                name="arabicFont"
                value={font.id}
                checked={arabicFont === font.id}
                onChange={(e) => setArabicFont(e.target.value)}
                style={{ marginRight: '10px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '500', color: '#2c3e50' }}>{font.name}</span>
              <span
                style={{
                  marginLeft: '20px',
                  fontSize: 'var(--arabic-base)',
                  fontFamily: font.id === 'amiri' ? "'Amiri', serif" : font.id === 'noto' ? "'Noto Serif Arabic', serif" : "'Noto Kufi Arabic', sans-serif",
                  color: '#666'
                }}
              >
                ٱلْخَبِيرُ
              </span>
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