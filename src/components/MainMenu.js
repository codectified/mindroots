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
    onSelectCorpus(corpus); // Pass selected corpus to the handler
    navigate(`/list?corpus_id=${corpus.id}`); // Pass corpus_id in query parameters
  };

  return (
    <div>
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
