import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import PrimaryList from './components/PrimaryList';
import GraphScreen from './components/GraphScreen';
import { fetchNamesOfAllah, fetchWordsByForm, fetchWordsByNameId, fetchRootData } from './services/apiService';
import './App.css'; // Correct path to the CSS file

const App = () => {
  const [script, setScript] = useState('arabic'); // Default script set to Arabic
  const [names, setNames] = useState([]);
  const [rootData, setRootData] = useState({ nodes: [], links: [] });
  const [selectedName, setSelectedName] = useState(null);

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

  const handleSelectName = useCallback(async (name) => {
    try {
      setSelectedName(name);
      console.log('Selected name:', name);

      const nameId = name.name_id.low !== undefined ? name.name_id.low : name.name_id;
      console.log('nameId:', nameId);

      const response = await fetchWordsByNameId(nameId, script);
      console.log('Response data:', response);

      if (response.words.length > 0) {
        const nameNode = { id: `${response.name[script]}_name`, label: script === 'both' ? `${response.name.arabic} / ${response.name.english}` : response.name[script], ...response.name, type: 'name' };
        const wordNodes = response.words.map(word => ({ id: `${word[script]}_word`, label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script], ...word, type: 'word' }));
        const formNodes = response.forms.map(form => ({ id: `${form[script]}_form`, label: script === 'both' ? `${form.arabic} / ${form.english}` : form[script], ...form, type: 'form' }));
        const rootNodes = response.roots.map(root => ({ id: `${root[script]}_root`, label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script], ...root, type: 'root' }));

        const nodes = [nameNode, ...wordNodes, ...formNodes, ...rootNodes];
        const links = [
          ...response.words.map(word => ({ source: nameNode.id, target: `${word[script]}_word` })),
          ...response.forms.map(form => ({ source: wordNodes[0].id, target: `${form[script]}_form` })), // Assuming each word has one form for simplicity
          ...response.roots.map(root => ({ source: wordNodes[0].id, target: `${root[script]}_root` }))  // Assuming each word has one root for simplicity
        ];

        const newData = { nodes, links };
        console.log('Transformed rootData:', newData);
        setRootData(newData);
        console.log('rootData updated'); // Add this line to confirm state update
      } else {
        console.log('No data received for the selected name');
        setRootData({ nodes: [], links: [] });
        console.log('rootData cleared'); // Add this line to confirm state update
      }
    } catch (error) {
      console.error('Error fetching words for name:', error);
    }
  }, [script]);

  useEffect(() => {
    if (selectedName) {
      handleSelectName(selectedName);
    }
  }, [script, selectedName, handleSelectName]);

  const handleSwitchScript = (newScript) => {
    setScript(newScript);
  };

  return (
    <div className="App">
      <Router>
        <div className="overlay">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/list" element={<PrimaryList names={names} script={script} setScript={handleSwitchScript} onSelectName={handleSelectName} />} />
            <Route path="/graph" element={<GraphScreen selectedName={selectedName} script={script} setScript={handleSwitchScript} rootData={rootData} setRootData={setRootData} />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
};

export default App;
