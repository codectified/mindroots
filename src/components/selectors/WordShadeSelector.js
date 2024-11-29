// ../components/selectors/WordShadeSelector.js
import React from 'react';
import { useWordShade } from '../../contexts/WordShadeContext';

const WordShadeSelector = () => {
  const { wordShadeMode, setWordShadeMode } = useWordShade(); // Update context to include setWordShadeMode

  const handleChange = (event) => {
    setWordShadeMode(event.target.value); // Update the mode directly
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
      <label>Word Shade Mode:</label>
      <label>
        <input
          type="radio"
          value="grammatical"
          checked={wordShadeMode === 'grammatical'}
          onChange={handleChange}
        />
        Grammatical
      </label>
      <label>
        <input
          type="radio"
          value="ontological"
          checked={wordShadeMode === 'ontological'}
          onChange={handleChange}
        />
        Ontological
      </label>
    </div>
  );
};

export default WordShadeSelector;