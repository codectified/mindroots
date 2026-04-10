// ../components/TextLayoutToggle.js
import React from 'react';
import { useTextLayout } from '../../contexts/TextLayoutContext';
import { useLabels } from '../../hooks/useLabels';

const TextLayoutToggle = () => {
  const { layout, setLayout } = useTextLayout();
  const t = useLabels();

  const handleChange = (event) => {
    setLayout(event.target.value); // Update layout based on selection
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
      <label>{t.layout}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="prose"
            checked={layout === 'prose'}
            onChange={handleChange}
          />
          {t.prose}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="line-by-line"
            checked={layout === 'line-by-line'}
            onChange={handleChange}
          />
          {t.lineByLine}
        </label>
      </div>
    </div>
  );
};

export default TextLayoutToggle;