import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCorpora } from '../services/apiService';

const MainMenu = ({ onSelectCorpus }) => {
  const navigate = useNavigate();
  const [corpora, setCorpora] = useState([]);

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const data = await fetchCorpora();
        setCorpora(data);
      } catch (error) {
        console.error('Error fetching corpora:', error);
      }
    };
    fetchCorporaData();
  }, []);

  const handleSelect = (corpus) => {
    console.log('Selected corpus in MainMenu:', corpus);
  
    // Ensure onSelectCorpus function can handle both corpus and corpora
    onSelectCorpus(corpus, corpora); 
  
    // Navigate to the list of items in the selected corpus with query parameters
    navigate(`/list?corpus_id=${corpus.id}&corpus_name=${encodeURIComponent(corpus.name)}`);
  };
  

  return (
    <div>
            <h2>Select a corpus...</h2> {/* Added text */}
      <ul>
        {corpora.map(corpus => (
          <li key={corpus.id} onClick={() => handleSelect(corpus)}>
            {corpus.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MainMenu;
