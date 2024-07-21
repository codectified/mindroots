import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GraphVisualization from './components/GraphVisualization';
import { fetchNamesOfAllah, fetchRootForName, fetchWordsByForm, fetchWordData } from './services/apiService';

const App = () => {
  const [script, setScript] = useState('arabic'); // Default script set to Arabic
  const [names, setNames] = useState([]);
  const [rootData, setRootData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchNamesOfAllah(script);
        setNames(Array.isArray(response) ? response : []); // Ensure response is an array
        console.log('Fetched names of Allah:', response); // Add logging
      } catch (error) {
        console.error('Error fetching names of Allah:', error);
        setNames([]); // Set to empty array on error
      }
    };
    fetchData();
  }, [script]);

  const handleSelectName = async (name) => {
    try {
      const response = await fetchRootForName(name[script], script);
      console.log('Response data:', response); // Add logging to inspect the structure

      if (response && response.length > 0) {
        const data = response[0];
        const nodes = [data.root, ...data.words].map((item) => ({
          id: item[script],
          label: item[script],
          ...item
        }));
        const links = data.words.map((word) => ({
          source: data.root[script],
          target: word[script]
        }));
        const newData = { nodes, links };
        console.log('Transformed rootData:', newData); // Add logging
        setRootData(newData);
      } else {
        console.log('No data received for the selected name');
        setRootData({ nodes: [], links: [] });
      }
    } catch (error) {
      console.error('Error fetching root data for name:', error);
    }
  };

  const handleNodeClick = async (node) => {
    try {
      let response;
      console.log('Clicked node:', node);
  
      if (node.form_id) {
        console.log('Node form_id:', node.form_id);
        if (Array.isArray(node.form_id)) {
          for (const formId of node.form_id) {
            response = await fetchWordsByForm(formId, script);
            if (response && response.length > 0) {
              const newWords = response.map(word => ({
                id: word[script],
                label: word[script],
                ...word
              }));
              const newLinks = newWords.map(word => ({
                source: node.id,
                target: word.id
              }));
              const newData = { nodes: [...rootData.nodes, ...newWords], links: [...rootData.links, ...newLinks] };
              console.log('New rootData after node click:', newData);
              setRootData(newData);
            }
          }
        } else {
          response = await fetchWordsByForm(node.form_id, script);
          console.log('Fetched words by form:', response);
        }
      } else if (node.id) {
        response = await fetchWordData(node.id, script);
        console.log('Fetched word data:', response);
      }
  
      if (response && response.length > 0) {
        const newWords = response.map(word => ({
          id: word[script],
          label: word[script],
          ...word
        }));
        const newLinks = newWords.map(word => ({
          source: node.id,
          target: word.id
        }));
        const newData = { nodes: [...rootData.nodes, ...newWords], links: [...rootData.links, ...newLinks] };
        console.log('New rootData after node click:', newData);
        setRootData(newData);
      }
    } catch (error) {
      console.error('Error fetching data for clicked node:', error);
    }
  };
  

  const handleSwitchScript = () => {
    setScript(script === 'english' ? 'arabic' : 'english');
  };

  return (
    <div>
      <Header script={script} onSwitchScript={handleSwitchScript} />
      <div style={{ height: '200px', overflowY: 'scroll' }}>
        <ul>
          {names.map((name, index) => (
            <li key={index} onClick={() => handleSelectName(name)}>
              {script === 'english' ? name.english : name.arabic}
            </li>
          ))}
        </ul>
      </div>
      <GraphVisualization data={rootData} onNodeClick={handleNodeClick} />
    </div>
  );
};

export default App;
