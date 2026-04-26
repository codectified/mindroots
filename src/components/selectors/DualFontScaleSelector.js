import React, { useState, useEffect } from 'react';
import { useLabels } from '../../hooks/useLabels';
import clsx from 'clsx';

const DualFontScaleSelector = () => {
  const t = useLabels();
  const [latinScale, setLatinScale] = useState(() => {
    const saved = localStorage.getItem('fontScaleLatín');
    return saved ? parseFloat(saved) : 1.15; // default: large
  });

  const [semiticScale, setSemiticScale] = useState(() => {
    const saved = localStorage.getItem('fontScaleSemitic');
    return saved ? parseFloat(saved) : 1.3; // default: extra large
  });

  const scaleOptions = [
    { label: t.small,      value: 0.85, description: t.compactView    },
    { label: t.normal,     value: 1,    description: t.defaultSize    },
    { label: t.large,      value: 1.15, description: t.fifteenPercent },
    { label: t.extraLarge, value: 1.3,  description: t.thirtyPercent  },
    { label: t.xxLarge,    value: 1.5,  description: t.fiftyPercent   },
  ];

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
      <div className="mb-7">
        <h4 className="mt-0 mb-3 text-dynamic-base font-semibold text-primary">
          English
        </h4>
        <p className="text-muted text-[0.9rem] mb-2.5">
          {t.fontSizePercent((latinScale * 100).toFixed(0))}
        </p>

        {/* Scale preset buttons */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {scaleOptions.map((option) => (
            <button
              key={`latin-${option.value}`}
              onClick={() => setLatinScale(option.value)}
              title={option.description}
              className={clsx(
                'px-3 py-1.5 rounded text-[0.85rem] transition-all duration-200 cursor-pointer',
                latinScale === option.value
                  ? 'border-2 border-accent bg-accent-light text-accent font-semibold'
                  : 'border border-border bg-surface text-ink font-medium hover:border-border-dark hover:bg-surface-alt'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Fine-tune slider */}
        <input
          type="range"
          min="0.75" max="1.75" step="0.05"
          value={latinScale}
          onChange={(e) => setLatinScale(parseFloat(e.target.value))}
          className="w-full h-1 cursor-pointer mb-3"
        />
      </div>

      {/* Semitic/Arabic Font Scale */}
      <div className="mb-3">
        <h4 className="mt-0 mb-3 text-dynamic-base font-semibold text-primary">
          Semitic
        </h4>
        <p className="text-muted text-[0.9rem] mb-2.5">
          {t.fontSizePercent((semiticScale * 100).toFixed(0))}
        </p>

        {/* Scale preset buttons */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {scaleOptions.map((option) => (
            <button
              key={`semitic-${option.value}`}
              onClick={() => setSemiticScale(option.value)}
              title={option.description}
              className={clsx(
                'px-3 py-1.5 rounded text-[0.85rem] transition-all duration-200 cursor-pointer',
                semiticScale === option.value
                  ? 'border-2 border-arabic bg-arabic-light text-arabic font-semibold'
                  : 'border border-border bg-surface text-ink font-medium hover:border-border-dark hover:bg-surface-alt'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Fine-tune slider */}
        <input
          type="range"
          min="0.75" max="1.75" step="0.05"
          value={semiticScale}
          onChange={(e) => setSemiticScale(parseFloat(e.target.value))}
          className="w-full h-1 cursor-pointer mb-3"
        />
      </div>

      {/* Reset buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setLatinScale(1)}
          title={t.resetEnglishTitle}
          className="flex-1 px-2.5 py-1.5 bg-neutral hover:bg-neutral-hover text-white border-none rounded text-[0.85rem] font-medium transition-colors duration-200 cursor-pointer"
        >
          {t.resetEnglish}
        </button>
        <button
          onClick={() => setSemiticScale(1)}
          title={t.resetArabicTitle}
          className="flex-1 px-2.5 py-1.5 bg-neutral hover:bg-neutral-hover text-white border-none rounded text-[0.85rem] font-medium transition-colors duration-200 cursor-pointer"
        >
          {t.resetArabic}
        </button>
      </div>
    </div>
  );
};

export default DualFontScaleSelector;
