import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchCorpusItems } from '../../services/apiService';
import Menu from '../navigation/Menu';
import { useScript } from '../../contexts/ScriptContext';
import { useCorpus } from '../../contexts/CorpusContext';

const PrimaryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [names, setNames] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState(['arabic', 'english']); // Default languages
  const { L1, setL1, L2, setL2 } = useScript();
  const { handleSelectCorpusItem } = useCorpus();

  const queryParams = new URLSearchParams(location.search);
  const corpusId = queryParams.get('corpus_id');
  const corpusName = queryParams.get('corpus_name');

  useEffect(() => {
    const fetchData = async () => {
      if (corpusId) {
        try {
          const response = await fetchCorpusItems(corpusId, L1);
          setNames(response);
          console.log('Fetched corpus items:', response);

          // Dynamically set available languages based on corpus item properties
          if (response.length > 0) {
            const item = response[0]; // Assuming all items in the corpus have the same language properties
            const languages = ['arabic', 'english'];
            if (item.transliteration) languages.push('transliteration');
            setAvailableLanguages(languages);
          }
          
        } catch (error) {
          console.error('Error fetching corpus items:', error);
        }
      } else {
        console.error('Corpus ID is missing in query parameters');
      }
    };
    fetchData();
  }, [corpusId, L1]);

  const handleItemClick = (name) => {
    handleSelectCorpusItem(name);
    navigate('/graph');
  };

  return (
    <div>
      <Menu />
      <h1>{corpusName}</h1>
      <ul>
        {names.map((name) => (
          <li key={name.item_id} onClick={() => handleItemClick(name)}>
            {L2 === 'off' 
              ? name[L1] 
              : `${name[L1]} / ${name[L2]}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrimaryList;
