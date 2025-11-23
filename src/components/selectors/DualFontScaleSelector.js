import React, { useState, useEffect } from 'react';

const DualFontScaleSelector = () => {
  const [latinScale, setLatinScale] = useState(() => {
    const saved = localStorage.getItem('fontScaleLatín');
    return saved ? parseFloat(saved) : 1;
  });

  const [semiticScale, setSemiticScale] = useState(() => {
    const saved = localStorage.getItem('fontScaleSemitic');
    return saved ? parseFloat(saved) : 1;
  });

  // Font scale presets
  const scaleOptions = [
    { label: 'Small', value: 0.85, description: 'Compact view' },
    { label: 'Normal', value: 1, description: 'Default size' },
    { label: 'Large', value: 1.15, description: '15% larger' },
    { label: 'Extra Large', value: 1.3, description: '30% larger' },
    { label: 'XX-Large', value: 1.5, description: '50% larger' },
  ];

  // Update font scales in CSS and localStorage
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale-latin', latinScale);
    localStorage.setItem('fontScaleLatín', latinScale);
  }, [latinScale]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale-semitic', semiticScale);
    localStorage.setItem('fontScaleSemitic', semiticScale);
  }, [semiticScale]);

  return (
    <div>
      {/* Latin/English Font Scale */}
      <div style={{ marginBottom: '28px' }}>
        <h4 style={{ marginTop: '0', marginBottom: '12px', fontSize: 'var(--text-base)', fontWeight: '600', color: '#2c3e50' }}>
          English & Latin Text
        </h4>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
          Font size: {(latinScale * 100).toFixed(0)}%
        </p>

        {/* Latin scale buttons */}
        <div className="font-scale-buttons" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {scaleOptions.map((option) => (
            <button
              key={`latin-${option.value}`}
              onClick={() => setLatinScale(option.value)}
              style={{
                padding: '6px 12px',
                border: latinScale === option.value ? '2px solid #2c7fb8' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: latinScale === option.value ? '#e3f2fd' : '#f8f9fa',
                color: latinScale === option.value ? '#2c7fb8' : '#333',
                cursor: 'pointer',
                fontWeight: latinScale === option.value ? '600' : '500',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Latin slider */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="range"
            min="0.75"
            max="1.75"
            step="0.05"
            value={latinScale}
            onChange={(e) => setLatinScale(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', height: '4px' }}
          />
        </div>
      </div>

      {/* Semitic/Arabic Font Scale */}
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ marginTop: '0', marginBottom: '12px', fontSize: 'var(--text-base)', fontWeight: '600', color: '#2c3e50' }}>
          Arabic & Semitic Text
        </h4>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
          Font size: {(semiticScale * 100).toFixed(0)}%
        </p>

        {/* Semitic scale buttons */}
        <div className="font-scale-buttons" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {scaleOptions.map((option) => (
            <button
              key={`semitic-${option.value}`}
              onClick={() => setSemiticScale(option.value)}
              style={{
                padding: '6px 12px',
                border: semiticScale === option.value ? '2px solid #c85a17' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: semiticScale === option.value ? '#fef3e6' : '#f8f9fa',
                color: semiticScale === option.value ? '#c85a17' : '#333',
                cursor: 'pointer',
                fontWeight: semiticScale === option.value ? '600' : '500',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Semitic slider */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="range"
            min="0.75"
            max="1.75"
            step="0.05"
            value={semiticScale}
            onChange={(e) => setSemiticScale(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', height: '4px' }}
          />
        </div>
      </div>

      {/* Reset buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setLatinScale(1)}
          style={{
            flex: 1,
            padding: '6px 10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'background-color 0.2s',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
          title="Reset English & Latin text to normal size"
        >
          Reset English
        </button>
        <button
          onClick={() => setSemiticScale(1)}
          style={{
            flex: 1,
            padding: '6px 10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'background-color 0.2s',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
          title="Reset Arabic & Semitic text to normal size"
        >
          Reset Arabic
        </button>
      </div>
    </div>
  );
};

export default DualFontScaleSelector;
