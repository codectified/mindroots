import React, { useState, useEffect } from 'react';

const FontScaleSelector = () => {
  const [fontScale, setFontScale] = useState(() => {
    // Get saved preference from localStorage
    const saved = localStorage.getItem('fontScale');
    return saved ? parseFloat(saved) : 1;
  });

  // Font scale options
  const scaleOptions = [
    { label: 'Small', value: 0.85, description: 'Compact view' },
    { label: 'Normal', value: 1, description: 'Default size' },
    { label: 'Large', value: 1.15, description: '15% larger' },
    { label: 'Extra Large', value: 1.3, description: '30% larger' },
    { label: 'XX-Large', value: 1.5, description: '50% larger' },
  ];

  // Update font scale
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale);
    localStorage.setItem('fontScale', fontScale);
  }, [fontScale]);

  return (
    <div>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
        Font size: {(fontScale * 100).toFixed(0)}%
      </p>

      {/* Scale buttons - compact for mini-menu */}
      <div className="font-scale-buttons" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {scaleOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFontScale(option.value)}
            style={{
              padding: '6px 12px',
              border: fontScale === option.value ? '2px solid #2c7fb8' : '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: fontScale === option.value ? '#e3f2fd' : '#f8f9fa',
              color: fontScale === option.value ? '#2c7fb8' : '#333',
              cursor: 'pointer',
              fontWeight: fontScale === option.value ? '600' : '500',
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Slider for fine-tuning */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="range"
          min="0.75"
          max="1.75"
          step="0.05"
          value={fontScale}
          onChange={(e) => setFontScale(parseFloat(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', height: '4px' }}
        />
      </div>

      {/* Reset button */}
      <button
        onClick={() => setFontScale(1)}
        style={{
          padding: '4px 10px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
      >
        Reset
      </button>
    </div>
  );
};

export default FontScaleSelector;
