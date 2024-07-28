// src/components/MainMenu.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCorpora } from '../services/apiService';
import { useCorpus } from './CorpusContext';

const MainMenu = () => {
  const navigate = useNavigate();
  const { setSelectedCorpus } = useCorpus();
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

  const handleSelect = (path, corpus) => {
    setSelectedCorpus(corpus);
    navigate(path);
  };

  return (
    <div>
      <ul>
        {corpora.map(corpus => (
          <li key={corpus.id} onClick={() => handleSelect('/list', corpus)}>{corpus.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default MainMenu;
