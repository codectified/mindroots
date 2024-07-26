import { fetchRootData } from '../services/apiService';

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

export default handleRootNodeClick;
