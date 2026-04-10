import React from 'react';
import { useCorpusFilter } from '../../contexts/CorpusFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLabels } from '../../hooks/useLabels';

const ContextShiftSelector = () => {
  const { corpusFilter, setCorpusFilter } = useCorpusFilter();
  const { corpora } = useCorpus();
  const { L1, L2 } = useLanguage();
  const t = useLabels();

  const getCorpusName = (corpusId) => {
    const corpus = corpora.find(c => c.id === corpusId);
    if (!corpus) return t.lexicon;
    return L2 === 'off' ? corpus[L1] : `${corpus[L1]} / ${corpus[L2]}`;
  };

  return (
    <div className="selector-row">
      <div className="selector-pair">
        <label>{t.corpusLabel}</label>
        <select
          className="uniform-select"
          value={corpusFilter}
          onChange={(e) => setCorpusFilter(e.target.value)}
        >
          <option value="lexicon">{t.lexicon}</option>
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
