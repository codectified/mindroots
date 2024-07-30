import React, { useEffect } from 'react';

const ContextShiftSelector = ({ contextFilterRoot, contextFilterForm, handleContextFilterChange, corpora }) => {
  useEffect(() => {
    console.log(`Context filter root changed to: ${contextFilterRoot}`);
  }, [contextFilterRoot]);

  useEffect(() => {
    console.log(`Context filter form changed to: ${contextFilterForm}`);
  }, [contextFilterForm]);

  const isCorporaArray = Array.isArray(corpora);

  return (
    <div>
      <label>Root Context:</label>
      <select name="root" value={contextFilterRoot} onChange={handleContextFilterChange}>
        <option value="lexicon">Lexicon</option>
        {isCorporaArray && corpora.map(corpus => (
          <option key={corpus.id} value={`corpus_${corpus.id}`}>{corpus.name}</option>
        ))}
      </select>

      <label>Form Context:</label>
      <select name="form" value={contextFilterForm} onChange={handleContextFilterChange}>
        <option value="lexicon">Lexicon</option>
        {isCorporaArray && corpora.map(corpus => (
          <option key={corpus.id} value={`corpus_${corpus.id}`}>{corpus.name}</option>
        ))}
      </select>
    </div>
  );
};

export default ContextShiftSelector;
