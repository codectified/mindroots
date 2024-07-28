// src/App.js

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import PrimaryList from './components/PrimaryList';
import GraphScreen from './components/GraphScreen';
import { fetchNamesOfAllah, fetchCorpora, fetchWordsByCorpusItem } from './services/apiService';
import { CorpusProvider } from './components/CorpusContext';
import './App.css';

const App = () => {
  const [script, setScript] = useState('arabic');
  const [names, setNames] = useState([]);
  const [rootData, setRootData] = useState({ nodes: [], links: [] });
  const [selectedName, setSelectedName] = useState(null);
  const [corpora, setCorpora] = useState([]);
  const [contextFilter, setContextFilter] = useState('lexicon');

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

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const corporaData = await fetchCorpora();
        setCorpora(corporaData);
      } catch (error) {
        console.error('Error fetching corpora:', error);
      }
    };
    fetchCorporaData();
  }, []);

  const handleSelectName = useCallback(async (name) => {
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
        console.log('rootData updated');
      } else {
        console.log('No data received for the selected name');
        setRootData({ nodes: [], links: [] });
        console.log('rootData cleared');
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

  const handleContextFilterChange = (event) => {
    setContextFilter(event.target.value);
  };

  return (
    <CorpusProvider>
      <Router>
        <div className="overlay">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/list" element={<PrimaryList names={names} script={script} setScript={handleSwitchScript} onSelectName={handleSelectName} />} />
            <Route path="/graph" element={<GraphScreen selectedName={selectedName} script={script} setScript={handleSwitchScript} rootData={rootData} setRootData={setRootData} corpora={corpora} contextFilter={contextFilter} handleContextFilterChange={handleContextFilterChange} />} />
          </Routes>
        </div>
      </Router>
    </CorpusProvider>
  );
};

export default App;
