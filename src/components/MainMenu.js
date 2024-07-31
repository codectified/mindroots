import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCorpora } from '../services/apiService';

const MainMenu = ({ onSelectCorpus }) => {
  const navigate = useNavigate();
  const [corpora, setCorpora] = useState([]); // Initialize corpora state

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const data = await fetchCorpora();
        setCorpora(data); // Set the corpora state with fetched data
      } catch (error) {
        console.error('Error fetching corpora:', error);
      }
    };
    fetchCorporaData();
  }, []);

  const handleSelect = (corpus) => {
    console.log('Selected corpus in MainMenu:', corpus);
    onSelectCorpus(corpus, corpora); // Pass corpora to the function to handle corpus selection
    navigate('/list'); // Navigate to the list of items in the selected corpus
  };

  return (
    <div>
      <ul>
        {corpora.map(corpus => (
          <li key={corpus.id} onClick={() => handleSelect(corpus)}>{corpus.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default MainMenu;
