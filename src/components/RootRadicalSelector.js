import React from 'react';

const RootRadicalSelector = ({ arabicAlphabet, r1, r2, r3, setR1, setR2, setR3, handleRootRadicalChange }) => (
  <div>
    <label>
      R1:
      <select value={r1} onChange={(e) => setR1(e.target.value)}>
        <option value="">*</option>
        {arabicAlphabet.map((letter, index) => (
          <option key={index} value={letter}>{letter}</option>
        ))}
      </select>
    </label>
    <label>
      R2:
      <select value={r2} onChange={(e) => setR2(e.target.value)}>
        <option value="">*</option>
        {arabicAlphabet.map((letter, index) => (
          <option key={index} value={letter}>{letter}</option>
        ))}
      </select>
    </label>
    <label>
      R3:
      <select value={r3} onChange={(e) => setR3(e.target.value)}>
        <option value="">*</option>
        {arabicAlphabet.map((letter, index) => (
          <option key={index} value={letter}>{letter}</option>
        ))}
      </select>
    </label>
    <button onClick={handleRootRadicalChange}>Filter</button>
  </div>
);

export default RootRadicalSelector;
