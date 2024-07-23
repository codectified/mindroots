import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GraphVisualization from './components/GraphVisualization';
import { fetchNamesOfAllah, fetchWordsByForm, fetchWordsByNameId } from './services/apiService';

const App = () => {
  const [script, setScript] = useState('arabic'); // Default script set to Arabic
  const [names, setNames] = useState([]);
  const [rootData, setRootData] = useState({ nodes: [], links: [] });

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

  const handleSelectName = async (name) => {
    try {
      console.log('Selected name:', name); // Add logging to inspect the selected name

      const nameId = name.name_id.low !== undefined ? name.name_id.low : name.name_id; // Ensure name_id is properly retrieved
      console.log('nameId:', nameId); // Add logging to check the value of nameId

      const response = await fetchWordsByNameId(nameId, script);
      console.log('Response data:', response); // Add logging to inspect the structure

      if (response.words.length > 0) {
        const nameNode = { id: response.name[script], label: response.name[script], ...response.name };
        const wordNodes = response.words.map(word => ({ id: word[script], label: word[script], ...word }));
        const formNodes = response.forms.map(form => ({ id: form[script], label: form[script], ...form }));
        const rootNodes = response.roots.map(root => ({ id: root[script], label: root[script], ...root }));

        const nodes = [nameNode, ...wordNodes, ...formNodes, ...rootNodes];
        const links = [
          ...response.words.map(word => ({ source: nameNode.id, target: word[script] })),
          ...response.forms.map(form => ({ source: wordNodes[0].id, target: form[script] })), // Assuming each word has one form for simplicity
          ...response.roots.map(root => ({ source: wordNodes[0].id, target: root[script] }))  // Assuming each word has one root for simplicity
        ];

        const newData = { nodes, links };
        console.log('Transformed rootData:', newData); // Add logging
        setRootData(newData);
      } else {
        console.log('No data received for the selected name');
        setRootData({ nodes: [], links: [] });
      }
    } catch (error) {
      console.error('Error fetching words for name:', error);
    }
  };

  const handleNodeClick = async (node) => {
    try {
      console.log('Clicked node:', node);

      if (node.form_id) {
        const formIds = Array.isArray(node.form_id) ? node.form_id : [node.form_id];
        const allResponses = await Promise.all(formIds.map(formId => fetchWordsByForm(formId, script)));
        const allNewWords = allResponses.flat().map(word => ({
          id: word[script],
          label: word[script],
          ...word
        }));

        const formNode = {
          id: `form_${formIds[0]}`,
          label: `Form ${formIds[0]}`,
        };

        const newNodes = [formNode, ...allNewWords];
        const newLinks = [
          { source: node.id, target: formNode.id },
          ...allNewWords.map(word => ({
            source: formNode.id,
            target: word.id
          }))
        ];

        const newData = {
          nodes: [...rootData.nodes, ...newNodes],
          links: [...rootData.links, ...newLinks]
        };

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
