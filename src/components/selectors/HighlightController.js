import React from 'react';
import { useHighlight } from '../../contexts/HighlightContext';

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
    setHighlightColor, // Add highlight color state
  } = useHighlight();

  const highlightOptions = [
    {
      label: 'Nouns (f.)',
      value: 'feminine',
      active: highlightGender === 'feminine',
      setState: () => setHighlightGender(highlightGender === 'feminine' ? null : 'feminine'),
      color: '#FFD700',
    },
    {
      label: 'Verbs',
      value: 'verb',
      active: highlightVerb,
      setState: () => setHighlightVerb(!highlightVerb),
      color: '#32CD32',
    },
    {
      label: 'Particles',
      value: 'particle',
      active: highlightParticle,
      setState: () => setHighlightParticle(!highlightParticle),
      color: '#007bff',
    },
    {
      label: 'Freeform Mode',
      value: 'freeform',
      active: freeformMode,
      setState: () => setFreeformMode(!freeformMode),
      color: '#FF4500',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
      <label>Highlight:</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {highlightOptions.map((option) => (
          <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <label htmlFor="highlight-color">Highlight Color: </label>
          <select
            id="highlight-color"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
          >
            <option value="#FF4500">Orange</option>
            <option value="#FFD700">Gold</option>
            <option value="#32CD32">Green</option>
            <option value="#007bff">Blue</option>
            <option value="#800080">Purple</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default HighlightController;