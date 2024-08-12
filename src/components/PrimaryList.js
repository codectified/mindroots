// PrimaryList.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchCorpusItems, fetchWordsByCorpusItem } from '../services/apiService';

const PrimaryList = ({ script, setScript, setRootData, setSelectedName, selectedCorpus }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [names, setNames] = useState([]);

  // Extract corpus_id and corpus_name from the query parameters
  const queryParams = new URLSearchParams(location.search);
  const corpusId = queryParams.get('corpus_id');
  const corpusName = queryParams.get('corpus_name');

  useEffect(() => {
    const fetchData = async () => {
      if (corpusId) {
        try {
          const response = await fetchCorpusItems(corpusId, script);
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
  }, [corpusId, script]);

  const handleNameClick = async (name) => {
    try {
      setSelectedName(name);
      console.log('Selected name:', name);
  
      const nameId = name.item_id;
      const response = await fetchWordsByCorpusItem(nameId, corpusId, script); // Pass corpusId here
      console.log('Response data:', response);
  
      if (response && response.words.length > 0) {
        const nameNode = {
          id: `${response.item?.[script]}_name`,
          label: script === 'both' ? `${response.item?.arabic} / ${response.item?.english}` : response.item?.[script],
          ...response.item,
          type: 'name',
        };
  
        const wordNodes = response.words.map(word => ({
          id: `${word?.[script]}_word`,
          label: script === 'both' ? `${word?.arabic} / ${word?.english}` : word?.[script],
          ...word,
          type: 'word',
        }));
  
        const formNodes = response.forms.map(form => ({
          id: `${form?.[script]}_form`,
          label: script === 'both' ? `${form?.arabic} / ${form?.english}` : form?.[script],
          ...form,
          type: 'form',
        }));
  
        const rootNodes = response.roots.map(root => ({
          id: `${root?.[script]}_root`,
          label: script === 'both' ? `${root?.arabic} / ${root?.english}` : root?.[script],
          ...root,
          type: 'root',
        }));
  
        const nodes = [nameNode, ...wordNodes, ...formNodes, ...rootNodes];
        const links = [
          ...response.words.map(word => ({ source: nameNode.id, target: `${word?.[script]}_word` })),
          ...response.forms.map(form => ({ source: wordNodes[0]?.id, target: `${form?.[script]}_form` })), 
          ...response.roots.map(root => ({ source: wordNodes[0]?.id, target: `${root?.[script]}_root` })),
        ];
  
        const newData = { nodes, links };
        setRootData(newData);
        console.log('rootData updated');
      } else {
        console.log('No data received for the selected name');
        setRootData({ nodes: [], links: [] });
      }
    } catch (error) {
      console.error('Error fetching words for name:', error);
    }
    navigate('/graph');
  };

  const handleScriptChange = (event) => {
    setScript(event.target.value);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <h1>{corpusName}</h1>
      <select value={script} onChange={handleScriptChange}>
        <option value="arabic">Arabic</option>
        <option value="english">English</option>
        <option value="both">Both</option>
      </select>
      <ul>
        {names.map((name) => (
          <li key={name.item_id} onClick={() => handleNameClick(name)}>
            {script === 'arabic' ? name.arabic : script === 'english' ? name.english : `${name.arabic} / ${name.english}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrimaryList;
