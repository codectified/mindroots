import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchCorpusItems } from '../services/apiService';
import Menu from './Menu';
import { useScript } from '../contexts/ScriptContext';
import { useCorpus } from '../contexts/CorpusContext';

const PrimaryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [names, setNames] = useState([]);
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
      <div>
        <label>L1: </label>
        <select value={L1} onChange={(e) => setL1(e.target.value)}>
          <option value="arabic">Arabic</option>
          <option value="english">English</option>
        </select>
      </div>
      <div>
        <label>L2: </label>
        <select value={L2} onChange={(e) => setL2(e.target.value)}>
          <option value="off">Off</option>
          <option value="arabic">Arabic</option>
          <option value="english">English</option>
        </select>
      </div>
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
