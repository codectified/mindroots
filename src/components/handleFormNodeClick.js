import { fetchWordsByForm } from '../services/apiService';

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

export default handleFormNodeClick;
