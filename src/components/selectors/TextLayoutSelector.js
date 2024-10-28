// components/TextLayoutToggle.js
import React from 'react';
import { useTextLayout } from '../../contexts/TextLayoutContext';

const TextLayoutToggle = () => {
  const { layout, setLayout } = useTextLayout();

  const handleChange = (newLayout) => {
    setLayout(newLayout); // Update layout based on selection
  };

  return (
    <div>
      <label style={{ marginRight: '10px' }}>Text Layout:</label>
      <label>
        <input
          type="checkbox"
          checked={layout === 'prose'}
          onChange={() => handleChange('prose')}
        />
        Prose
      </label>
      <label style={{ marginLeft: '10px' }}>
        <input
          type="checkbox"
          checked={layout === 'line-by-line'}
          onChange={() => handleChange('line-by-line')}
        />
        Line-by-Line
      </label>
    </div>
  );
};

export default TextLayoutToggle;