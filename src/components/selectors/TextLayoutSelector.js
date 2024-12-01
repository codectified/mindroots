// ../components/TextLayoutToggle.js
import React from 'react';
import { useTextLayout } from '../../contexts/TextLayoutContext';

const TextLayoutToggle = () => {
  const { layout, setLayout } = useTextLayout();

  const handleChange = (event) => {
    setLayout(event.target.value); // Update layout based on selection
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
      <label>Text Layout:</label>
      <div style={{ display: 'flex', gap: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="prose"
            checked={layout === 'prose'}
            onChange={handleChange}
          />
          Prose
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="line-by-line"
            checked={layout === 'line-by-line'}
            onChange={handleChange}
          />
          Line By Line
        </label>
      </div>
    </div>
  );
};

export default TextLayoutToggle;