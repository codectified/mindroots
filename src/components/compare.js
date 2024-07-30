import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNamesOfAllah, fetchWordsByCorpusItem } from '../services/apiService';

const PrimaryList = ({ script, setScript, setRootData, setSelectedName, selectedCorpus }) => {
  const navigate = useNavigate();
  const [names, setNames] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchNamesOfAllah(script);
        setNames(response);
        console.log('Fetched names of Allah:', response);
      } catch (error) {
        console.error('Error fetching names of Allah:', error);
      }
    };
    fetchData();
  }, [script]);

  const handleNameClick = useCallback(async (name) => {
    try {
      setSelectedName(name);
      console.log('Selected name:', name);

      const nameId = name.name_id.low !== undefined ? name.name_id.low : name.name_id;
      console.log('nameId:', nameId);

      const response = await fetchWordsByCorpusItem(nameId, script);
      console.log('Response data:', response);

      if (response.words.length > 0) {
        const nameNode = { id: `${response.item[script]}_name`, label: script === 'both' ? `${response.item.arabic} / ${response.item.english}` : response.item[script], ...response.item, type: 'name' };
        const wordNodes = response.words.map(word => ({ id: `${word[script]}_word`, label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script], ...word, type: 'word' }));
        const formNodes = response.forms.map(form => ({ id: `${form[script]}_form`, label: script === 'both' ? `${form.arabic} / ${form.english}` : form[script], ...form, type: 'form' }));
        const rootNodes = response.roots.map(root => ({ id: `${root[script]}_root`, label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script], ...root, type: 'root' }));

        const nodes = [nameNode, ...wordNodes, ...formNodes, ...rootNodes];
        const links = [
          ...response.words.map(word => ({ source: nameNode.id, target: `${word[script]}_word` })),
          ...response.forms.map(form => ({ source: wordNodes[0]?.id, target: `${form[script]}_form` })), // Assuming each word has one form for simplicity
          ...response.roots.map(root => ({ source: wordNodes[0]?.id, target: `${root[script]}_root` }))  // Assuming each word has one root for simplicity
        ];

        const newData = { nodes, links };
        console.log('Transformed rootData:', newData);
        setRootData(newData);
      } else {
        setRootData({ nodes: [], links: [] });
      }
      navigate('/graph');
    } catch (error) {
      console.error('Error fetching words for name:', error);
    }
  }, [script, setRootData, setSelectedName, navigate]);

  const handleScriptChange = (event) => {
    setScript(event.target.value);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <h1>Names of Allah</h1>
      <select value={script} onChange={handleScriptChange}>
        <option value="arabic">Arabic</option>
        <option value="english">English</option>
        <option value="both">Both</option>
      </select>
      <ul>
        {names.map((name, index) => (
          <li key={name.name_id} onClick={() => handleNameClick(name)}>
            {script === 'arabic' ? name.arabic : script === 'english' ? name.english : `${name.arabic} / ${name.english}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrimaryList;
