import React, { useEffect } from 'react';
import { useContextFilter } from '../../contexts/ContextFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import { useScript } from '../../contexts/ScriptContext';

const ContextShiftSelector = () => {
  const { contextFilterRoot, setContextFilterRoot, contextFilterForm, setContextFilterForm } = useContextFilter();
  const { corpora } = useCorpus();
  const { L1, L2 } = useScript();

  const handleContextFilterChange = (event) => {
    const { name, value } = event.target;
    if (name === 'root') {
      setContextFilterRoot(value);
    } else if (name === 'form') {
      setContextFilterForm(value);
    }
  };

  useEffect(() => {
    console.log(`Context filter root changed to: ${contextFilterRoot}`);
  }, [contextFilterRoot]);

  useEffect(() => {
    console.log(`Context filter form changed to: ${contextFilterForm}`);
  }, [contextFilterForm]);

  // Get the name of the selected corpus based on contextFilterForm or contextFilterRoot
  const getCorpusName = (corpusId) => {
    const corpus = corpora.find(c => c.id === corpusId);
    if (!corpus) return 'Lexicon';
    return L2 === 'off' ? corpus[L1] : `${corpus[L1]} / ${corpus[L2]}`;
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', rowGap: '2px', columnGap: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
        <label>Form Context:</label>
        <select name="form" value={contextFilterForm} onChange={handleContextFilterChange} style={{ margin: 0 }}>
          <option value="lexicon">Lexicon</option>
          {corpora.map(corpus => (
            <option key={corpus.id} value={corpus.id}>
              {getCorpusName(corpus.id)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
        <label>Root Context:</label>
        <select name="root" value={contextFilterRoot} onChange={handleContextFilterChange} style={{ margin: 0 }}>
          <option value="lexicon">Lexicon</option>
          {corpora.map(corpus => (
            <option key={corpus.id} value={corpus.id}>
              {getCorpusName(corpus.id)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ContextShiftSelector;
