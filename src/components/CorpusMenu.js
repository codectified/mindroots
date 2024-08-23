import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCorpora } from '../services/apiService';
import Menu from './Menu';
import { useCorpus } from '../contexts/CorpusContext';
import { useScript } from '../contexts/ScriptContext';

const CorpusMenu = () => {
  const navigate = useNavigate();
  const { handleSelectCorpus } = useCorpus(); // Use context to store the selected corpus
  const { L1, setL1, L2, setL2 } = useScript(); // Get L1 and L2 from context
  const [corpora, setCorpora] = useState([]); // Manage corpora locally
  const [availableLanguages, setAvailableLanguages] = useState(['arabic', 'english']); // Default languages

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const data = await fetchCorpora();
        setCorpora(data); // Fetch and store corpora locally

        // Determine available languages based on corpus properties
        if (data.length > 0) {
          const sampleCorpus = data[0]; // Assuming all corpora have the same language properties
          const languages = ['arabic', 'english'];
          if (sampleCorpus.transliteration) languages.push('transliteration');
          setAvailableLanguages(languages);
        }
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
    navigate(`/list?corpus_id=${corpus.id}&corpus_name=${encodeURIComponent(corpus[L1] || corpus.english)}`);
  };

  return (
    <div>
      <Menu />
      <h2>Select a corpus...</h2>
      <ul>
        {corpora.map(corpus => (
          <li key={corpus.id} onClick={() => handleSelect(corpus)}>
            {L2 === 'off' 
              ? corpus[L1] 
              : `${corpus[L1]} / ${corpus[L2]}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CorpusMenu;
