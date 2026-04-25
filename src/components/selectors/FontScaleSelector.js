import React, { useState, useEffect } from 'react';
import { useLabels } from '../../hooks/useLabels';

const FontScaleSelector = () => {
  const t = useLabels();
  const [fontScale, setFontScale] = useState(() => {
    // Get saved preference from localStorage
    const saved = localStorage.getItem('fontScale');
    return saved ? parseFloat(saved) : 1;
  });

  // Font scale options
  const scaleOptions = [
    { label: t.small, value: 0.85, description: t.compactView },
    { label: t.normal, value: 1, description: t.defaultSize },
    { label: t.large, value: 1.15, description: t.fifteenPercent },
    { label: t.extraLarge, value: 1.3, description: t.thirtyPercent },
    { label: t.xxLarge, value: 1.5, description: t.fiftyPercent },
  ];

  // Update font scale
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale);
    localStorage.setItem('fontScale', fontScale);
  }, [fontScale]);

  return (
    <div>
      <p className="text-muted text-[0.9rem] mb-[10px]">
        {t.fontSizePercent((fontScale * 100).toFixed(0))}
      </p>

      {/* Scale buttons - compact for mini-menu */}
      <div className="flex flex-wrap gap-[6px] mb-3">
        {scaleOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFontScale(option.value)}
            className={`py-[6px] px-3 rounded cursor-pointer text-[0.85rem] transition-all duration-200 ${fontScale === option.value ? 'border-2 border-accent bg-[#e3f2fd] text-accent font-semibold' : 'border border-[#ccc] bg-surface text-[#333] font-medium'}`}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Slider for fine-tuning */}
      <div className="mb-3">
        <input
          type="range"
          min="0.75"
          max="1.75"
          step="0.05"
          value={fontScale}
          onChange={(e) => setFontScale(parseFloat(e.target.value))}
          className="w-full cursor-pointer h-1"
        />
      </div>

      {/* Reset button */}
      <button
        onClick={() => setFontScale(1)}
        className="py-1 px-[10px] bg-[#6c757d] text-white border-none rounded cursor-pointer text-[0.85rem] transition-[background-color] duration-200 hover:bg-[#5a6268]"
      >
        {t.reset}
      </button>
    </div>
  );
};

export default FontScaleSelector;
