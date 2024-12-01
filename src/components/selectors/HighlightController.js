// ../components/selectors/HighlightController.js
import React from 'react';
import { useHighlight } from '../../contexts/HighlightContext';

const HighlightController = () => {
  const { highlightGender, setHighlightGender, highlightVerb, setHighlightVerb, highlightParticle, setHighlightParticle } = useHighlight();

  // Define highlight options with relevant context values
  const highlightOptions = [
    {
      label: 'Nouns (f.)',
      value: 'feminine',
      active: highlightGender === 'feminine',
      setState: () => setHighlightGender(highlightGender === 'feminine' ? null : 'feminine'),
      color: '#FFD700', // Gold
    },
    {
      label: 'Verbs',
      value: 'verb',
      active: highlightVerb,
      setState: () => setHighlightVerb(!highlightVerb),
      color: '#32CD32', // Green
    },
    {
      label: 'Particles',
      value: 'particle',
      active: highlightParticle,
      setState: () => setHighlightParticle(!highlightParticle),
      color: '#007bff', // Blue
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
      <label>Highlight:</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {highlightOptions.map((option) => (
          <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="radio"
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
    </div>
  );
};

export default HighlightController;