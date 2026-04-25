import React from 'react';
import { useHighlight } from '../../contexts/HighlightContext';
import { useLabels } from '../../hooks/useLabels';

const HighlightController = () => {
  const {
    highlightGender,
    setHighlightGender,
    highlightVerb,
    setHighlightVerb,
    highlightParticle,
    setHighlightParticle,
    freeformMode,
    setFreeformMode,
    highlightColor,
    setHighlightColor,
  } = useHighlight();
  const t = useLabels();

  const highlightOptions = [
    { label: t.nounsF,      value: 'feminine', active: highlightGender === 'feminine', setState: () => setHighlightGender(highlightGender === 'feminine' ? null : 'feminine'), color: '#FFD700' },
    { label: t.verbs,       value: 'verb',      active: highlightVerb,                 setState: () => setHighlightVerb(!highlightVerb),                                        color: '#32CD32' },
    { label: t.particles,   value: 'particle',  active: highlightParticle,             setState: () => setHighlightParticle(!highlightParticle),                                color: '#007bff' },
    { label: t.freeformMode,value: 'freeform',  active: freeformMode,                  setState: () => setFreeformMode(!freeformMode),                                          color: '#FF4500' },
  ];

  return (
    <div className="flex flex-col gap-[10px] py-[10px]">
      <label>{t.highlight}</label>
      <div className="flex flex-col gap-[5px]">
        {highlightOptions.map((option) => (
          <label key={option.value} className="flex items-center gap-[10px]">
            {/* border/bg are runtime-computed from option.color — must stay inline */}
            <input
              type="checkbox"
              value={option.value}
              checked={option.active}
              onChange={option.setState}
              style={{
                appearance: 'none',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: `2px solid ${option.color}`,
                backgroundColor: option.active ? option.color : 'transparent',
                cursor: 'pointer',
              }}
            />
            <span style={{ color: option.color }}>{option.label}</span>
          </label>
        ))}
      </div>
      {freeformMode && (
        <div>
          <label htmlFor="highlight-color">{t.highlightColor}</label>
          <select id="highlight-color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)}>
            <option value="#FF4500">Orange</option>
            <option value="#FFD700">Gold</option>
            <option value="#32CD32">Green</option>
            <option value="#007bff">Blue</option>
            <option value="#800080">Purple</option>
            <option value="#FF69B4">Pink</option>
            <option value="#DC143C">Crimson</option>
            <option value="#00CED1">Turquoise</option>
            <option value="#8B4513">SaddleBrown</option>
            <option value="#000000">Black</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default HighlightController;
