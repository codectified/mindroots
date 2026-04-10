import React from 'react';
import { useLabels } from '../../hooks/useLabels';

const RootRadicalSelector = ({ arabicAlphabet, r1, r2, r3, setR1, setR2, setR3, handleRootRadicalChange }) => {
  const t = useLabels();
  return (
  <div>
    <label>ف:</label>
    <select value={r1} onChange={(e) => setR1(e.target.value)}>
      <option value="*">{t.wildcardLabel}</option>
      {arabicAlphabet.map(letter => <option key={letter} value={letter}>{letter}</option>)}
    </select>
    <label>ع:</label>
    <select value={r2} onChange={(e) => setR2(e.target.value)}>
      <option value="*">{t.wildcardLabel}</option>
      {arabicAlphabet.map(letter => <option key={letter} value={letter}>{letter}</option>)}
    </select>
    <label>ل:</label>
    <select value={r3} onChange={(e) => setR3(e.target.value)}>
      <option value="*">{t.wildcardLabel}</option>
      {arabicAlphabet.map(letter => <option key={letter} value={letter}>{letter}</option>)}
    </select>
    <button onClick={handleRootRadicalChange}>{t.addRoot}</button>
  </div>
  );
};

export default RootRadicalSelector;
