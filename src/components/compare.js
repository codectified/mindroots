import { fetchWordsByForm, fetchRootData } from '../services/apiService';

const handleRootNodeClick = async (node, script, rootData, setRootData, contextFilter) => {
  try {
    console.log('Fetching words for root ID:', node.root_id);
    const rootId = node.root_id.low !== undefined ? node.root_id.low : node.root_id;
    const response = await fetchRootData(rootId, script);
    console.log('Fetched words by root:', response);

    if (response && response.length > 0) {
      const newNodes = [];
      const newLinks = [];

      response.forEach(word => {
        const wordNode = {
          id: `word_${word.word_id}`,
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
  } catch (error) {
    console.error('Error fetching data for clicked root node:', error);
  }
};

const handleFormNodeClick = async (node, script, rootData, setRootData, contextFilter) => {
  try {
    console.log('Fetching words for form ID:', node.form_id);
    const formIds = Array.isArray(node.form_id) ? node.form_id : [node.form_id];
    const allResponses = await Promise.all(formIds.map(formId => fetchWordsByForm(formId, script)));
    const allNewWords = allResponses.flat().map(word => ({
      id: `word_${word.word_id}`,
      label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script],
      ...word,
      type: 'word'
    }));

    let newNodes = [];
    let newLinks = [];

    allNewWords.forEach(word => {
      const existingNode = rootData.nodes.find(n => n.id === word.id);
      if (!existingNode) {
        newNodes.push(word);
      }
      newLinks.push({ source: node.id, target: word.id });
    });

    // Apply context filter
    if (contextFilter === 'corpus') {
      newNodes = newNodes.filter(node => node.name_id);
      newLinks = newLinks.filter(link => newNodes.find(node => node.id === link.target));
    }

    const newData = {
      nodes: [...rootData.nodes, ...newNodes],
      links: [...rootData.links, ...newLinks]
    };

    console.log('New rootData after fetching form data:', newData);
    setRootData(newData);
  } catch (error) {
    console.error('Error fetching data for clicked form node:', error);
  }
};

const handleNodeClick = async (node, script, rootData, setRootData, contextFilter) => {
  if (node.root_id) {
    await handleRootNodeClick(node, script, rootData, setRootData, contextFilter);
  } else if (node.form_id) {
    await handleFormNodeClick(node, script, rootData, setRootData, contextFilter);
  }
};

export default handleNodeClick;
