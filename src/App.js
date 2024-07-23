import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import GraphVisualization from './components/GraphVisualization';
import { fetchNamesOfAllah, fetchWordsByForm, fetchWordsByNameId, fetchRootData } from './services/apiService';

const App = () => {
  const [script, setScript] = useState('arabic'); // Default script set to Arabic
  const [names, setNames] = useState([]);
  const [rootData, setRootData] = useState({ nodes: [], links: [] });
  const [selectedName, setSelectedName] = useState(null);
  const [showForms, setShowForms] = useState(true);
  const [showRoots, setShowRoots] = useState(true);

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

  const handleNodeClick = async (node) => {
    try {
      console.log('Clicked node:', node);
  
      if (node.form_id) {
        console.log('Fetching words for form ID:', node.form_id);
        const formIds = Array.isArray(node.form_id) ? node.form_id : [node.form_id];
        const allResponses = await Promise.all(formIds.map(formId => fetchWordsByForm(formId, script)));
        const allNewWords = allResponses.flat().map(word => ({
          id: `${word.arabic}_word_${word.english}`,
          label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script],
          ...word,
          type: 'word'
        }));
  
        const newNodes = [];
        const newLinks = [];
  
        allNewWords.forEach(word => {
          const existingNode = rootData.nodes.find(n => n.id === word.id);
          if (!existingNode) {
            newNodes.push(word);
          }
          newLinks.push({ source: node.id, target: word.id });
        });
  
        const newData = {
          nodes: [...rootData.nodes, ...newNodes],
          links: [...rootData.links, ...newLinks]
        };
  
        console.log('New rootData after fetching form data:', newData);
        setRootData(newData);
      } else if (node.root_id) {
        console.log('Fetching words for root ID:', node.root_id);
        const rootId = node.root_id.low !== undefined ? node.root_id.low : node.root_id;
        const response = await fetchRootData(rootId, script);
        console.log('Fetched words by root:', response);
  
        if (response && response.length > 0) {
          const newNodes = [];
          const newLinks = [];
  
          response.forEach(word => {
            const wordNode = {
              id: `${word.arabic}_word_${word.english}`,
              label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script],
              ...word,
              type: 'word'
            };
  
            const existingNode = rootData.nodes.find(n => n.id === wordNode.id);
            if (!existingNode) {
              newNodes.push(wordNode);
            }
            newLinks.push({ source: node.id, target: wordNode.id });
          });
  
          const newData = {
            nodes: [...rootData.nodes, ...newNodes],
            links: [...rootData.links, ...newLinks]
          };
  
          console.log('New rootData after fetching root data:', newData);
          setRootData(newData);
        } else {
          console.log('No data received for the clicked root');
        }
      }
    } catch (error) {
      console.error('Error fetching data for clicked node:', error);
    }
  };
  
  

  const handleSwitchScript = (newScript) => {
    setScript(newScript);
  };

  const handleToggleForms = () => {
    setShowForms(!showForms);
    if (selectedName) handleSelectName(selectedName);
  };

  const handleToggleRoots = () => {
    setShowRoots(!showRoots);
    if (selectedName) handleSelectName(selectedName);
  };

  const handleIncreaseNodes = () => {
    // Logic to increase the number of nodes (e.g., fetch more data or adjust visualization)
  };

  const handleDecreaseNodes = () => {
    // Logic to decrease the number of nodes (e.g., hide some data or adjust visualization)
  };

  const handleMainScreen = () => {
    setSelectedName(null);
    setRootData({ nodes: [], links: [] });
  };

  const handlePreviousName = () => {
    const currentIndex = names.findIndex(name => name.name_id === selectedName.name_id);
    const previousIndex = (currentIndex > 0) ? currentIndex - 1 : names.length - 1;
    handleSelectName(names[previousIndex]);
  };

  const handleNextName = () => {
    const currentIndex = names.findIndex(name => name.name_id === selectedName.name_id);
    const nextIndex = (currentIndex < names.length - 1) ? currentIndex + 1 : 0;
    handleSelectName(names[nextIndex]);
  };

  return (
    <div>
      <Header
        script={script}
        onSwitchScript={handleSwitchScript}
        onToggleForms={handleToggleForms}
        onToggleRoots={handleToggleRoots}
        onIncreaseNodes={handleIncreaseNodes}
        onDecreaseNodes={handleDecreaseNodes}
        onMainScreen={handleMainScreen}
        onPreviousName={handlePreviousName}
        onNextName={handleNextName}
      />
      <div style={{ height: '200px', overflowY: 'scroll' }}>
        <ul>
          {names.map((name, index) => (
            <li key={index} onClick={() => handleSelectName(name)}>
              {script === 'arabic' ? name.arabic : script === 'english' ? name.english : `${name.arabic} / ${name.english}`}
            </li>
          ))}
        </ul>
      </div>
      <GraphVisualization data={rootData} onNodeClick={handleNodeClick} />
    </div>
  );
};

export default App;
