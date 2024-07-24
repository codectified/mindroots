import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GraphVisualization from './GraphVisualization';
import { fetchWordsByNameId, fetchRootData, fetchWordsByForm } from '../services/apiService';

const GraphScreen = ({ selectedName, script, setScript, rootData, setRootData }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (selectedName) {
        const nameId = selectedName.name_id.low !== undefined ? selectedName.name_id.low : selectedName.name_id;
        const response = await fetchWordsByNameId(nameId, script);
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
          setRootData(newData);
        }
      }
    };
    fetchData();
  }, [selectedName, script, setRootData]);

  const handleBack = () => {
    navigate('/list');
  };

  const handleNext = () => {
    // Logic to navigate to the next name
  };

  const handlePrevious = () => {
    // Logic to navigate to the previous name
  };

  const handleScriptChange = (event) => {
    setScript(event.target.value);
  };

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

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <select value={script} onChange={handleScriptChange}>
        <option value="arabic">Arabic</option>
        <option value="english">English</option>
        <option value="both">Both</option>
      </select>
      <button onClick={handlePrevious}>Previous</button>
      <button onClick={handleNext}>Next</button>
      <GraphVisualization data={rootData} onNodeClick={handleNodeClick} />
    </div>
  );
};

export default GraphScreen;
