import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCorpora } from '../services/apiService';
import Menu from './Menu';
import { useCorpus } from '../contexts/CorpusContext';

const CorpusMenu = () => {
  const navigate = useNavigate();
  const { handleSelectCorpus } = useCorpus(); // Use context to store the selected corpus
  const [corpora, setCorpora] = useState([]); // Manage corpora locally

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const data = await fetchCorpora();
        setCorpora(data); // Fetch and store corpora locally
      } catch (error) {
        console.error('Error fetching corpora:', error);
      }
    };
    fetchCorporaData();
  }, []);

  const handleSelect = (corpus) => {
    console.log('Selected corpus in CorpusMenu:', corpus);
    handleSelectCorpus(corpus); // Store only the selected corpus in context

    // Navigate to the list of items in the selected corpus with query parameters
    navigate(`/list?corpus_id=${corpus.id}&corpus_name=${encodeURIComponent(corpus.english)}`);
  };

  return (
    <div>
      <Menu />
      <h2>Select a corpus...</h2>
      <ul>
        {corpora.map(corpus => (
          <li key={corpus.id} onClick={() => handleSelect(corpus)}>
            {corpus.english}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CorpusMenu;
