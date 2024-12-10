import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchCorpora } from '../../services/apiService';
import MiniMenu from './MiniMenu';
import { useCorpus } from '../../contexts/CorpusContext';
import { useScript } from '../../contexts/ScriptContext';

const ArticlesAndReferences = () => {
  const navigate = useNavigate();
  const { handleSelectCorpus } = useCorpus(); // Use context to store the selected corpus
  const { L1, L2 } = useScript(); // Get L1 and L2 from context
  const [corpora, setCorpora] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState(['arabic', 'english']); // Default languages

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const data = await fetchCorpora();
        setCorpora(data);

        if (data.length > 0) {
          const sampleCorpus = data[0];
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
    console.log('Selected corpus in ArticlesAndReferences:', corpus);
    handleSelectCorpus(corpus);
    navigate(`/list?corpus_id=${corpus.id}&corpus_name=${encodeURIComponent(corpus[L1] || corpus.english)}`);
  };

  return (
    <div>
      <MiniMenu />
  
      {/* Render corpus list */}
      <h2>Corpus Library</h2>
      <ul className="corpus-library-list">
        {corpora.map((corpus) => (
          <li key={corpus.id} onClick={() => handleSelect(corpus)}>
            {L2 === 'off' ? corpus[L1] : `${corpus[L1]} / ${corpus[L2]}`}
          </li>
        ))}
      </ul>
  

    </div>
  );
};

export default ArticlesAndReferences;