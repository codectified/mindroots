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
        setNames(response.data);
        console.log('Fetched names of Allah:', response.data); // Add logging
      } catch (error) {
        console.error('Error fetching names of Allah:', error);
      }
    };
    fetchData();
  }, [script]);

  const handleSelectName = async (name) => {
    try {
      const response = await fetchRootForName(name[script], script);
      console.log('Response data:', response.data); // Add logging to inspect the structure

      if (response.data.length > 0) {
        const data = response.data[0];
        // Transform data to match the required format for the graph visualization
        const nodes = [data.root, ...data.words].map((item, index) => ({
          id: item[script],
          label: item[script], // Ensure label is set for display
          ...item
        }));
        const links = data.words.map((word, index) => ({
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
    if (node.form_id) {
      // If the node is a form, fetch words by form ID
      try {
        const response = await fetchWordsByForm(node.form_id, script);
        if (response.data.length > 0) {
          const newWords = response.data.map(word => ({
            id: word[script],
            label: word[script],
            ...word
          }));
          const newLinks = newWords.map(word => ({
            source: node.id,
            target: word.id
          }));
          setRootData(prevData => ({
            nodes: [...prevData.nodes, ...newWords],
            links: [...prevData.links, ...newLinks]
          }));
        }
      } catch (error) {
        console.error('Error fetching words by form:', error);
      }
    } else if (node.id) {
      // If the node is a word, fetch related word data
      try {
        const response = await fetchWordData(node.id, script);
        if (response.data.length > 0) {
          const newWords = response.data.map(word => ({
            id: word[script],
            label: word[script],
            ...word
          }));
          const newLinks = newWords.map(word => ({
            source: node.id,
            target: word.id
          }));
          setRootData(prevData => ({
            nodes: [...prevData.nodes, ...newWords],
            links: [...prevData.links, ...newLinks]
          }));
        }
      } catch (error) {
        console.error('Error fetching word data:', error);
      }
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
