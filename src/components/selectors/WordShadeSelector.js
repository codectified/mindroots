// ../components/selectors/WordShadeSelector.js
import React from 'react';
import { useWordShade } from '../../contexts/WordShadeContext';

const WordShadeSelector = () => {
  const { wordShadeMode, setWordShadeMode } = useWordShade();

  const handleChange = (event) => {
    setWordShadeMode(event.target.value); // Update the word shade mode
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
      <label>Word Shade Mode:</label>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="none"
            checked={wordShadeMode === 'none'}
            onChange={handleChange}
          />
          None
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="grammatical"
            checked={wordShadeMode === 'grammatical'}
            onChange={handleChange}
          />
          Grammatical
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            value="ontological"
            checked={wordShadeMode === 'ontological'}
            onChange={handleChange}
          />
          Ontological
        </label>
      </div>
    </div>
  );
};

export default WordShadeSelector;