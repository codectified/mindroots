import React from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from './Menu';
import { useCorpus } from '../contexts/CorpusContext';

const CorpusMenu = () => {
  const navigate = useNavigate();
  const { corpora, handleSelectCorpus } = useCorpus();

  const handleSelect = (corpus) => {
    console.log('Selected corpus in CorpusMenu:', corpus);
    handleSelectCorpus(corpus); // Use the context function to select the corpus

    // Navigate to the list of items in the selected corpus with query parameters
    navigate(`/list?corpus_id=${corpus.id}&corpus_name=${encodeURIComponent(corpus.arabic)}`);
  };

  return (
    <div>
      <Menu />
      <h2>Select a corpus...</h2>
      <ul>
        {corpora.map(corpus => (
          <li key={corpus.id} onClick={() => handleSelect(corpus)}>
            {corpus.arabic}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CorpusMenu;
