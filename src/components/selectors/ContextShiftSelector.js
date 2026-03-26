import React from 'react';
import { useCorpusFilter } from '../../contexts/CorpusFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import { useLanguage } from '../../contexts/LanguageContext';

const ContextShiftSelector = () => {
  const { corpusFilter, setCorpusFilter } = useCorpusFilter();
  const { corpora } = useCorpus();
  const { L1, L2 } = useLanguage();

  const getCorpusName = (corpusId) => {
    const corpus = corpora.find(c => c.id === corpusId);
    if (!corpus) return 'Lexicon';
    return L2 === 'off' ? corpus[L1] : `${corpus[L1]} / ${corpus[L2]}`;
  };

  return (
    <div className="selector-row">
      <div className="selector-pair">
        <label>Corpus:</label>
        <select
          className="uniform-select"
          value={corpusFilter}
          onChange={(e) => setCorpusFilter(e.target.value)}
        >
          <option value="lexicon">Lexicon</option>
          {corpora.map((corpus) => (
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
