import { fetchRootByWord, fetchDefinitionsByWord } from '../services/apiService';

const handleWordNodeClick = async (node, L1, L2, graphData, setGraphData, corpusId, position, setInfoBubble) => {
  try {
    console.log('Handling word node click:', node);

    // Extract wordId correctly from the node
    const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;

    const currentNodes = graphData.nodes || [];
    const currentLinks = graphData.links || [];

    // Check if the root node is already displayed
    const rootNodeDisplayed = currentNodes.some(n => n.type === 'root' && n.root_id === node.root_id);

    if (!rootNodeDisplayed) {
      // Fetch and display the root node
      const root = await fetchRootByWord(wordId, L1, L2);
      const newRootNode = {
        id: `root_${root.root_id}`,
        label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
        ...root,
        type: 'root'
      };

      const newLink = { source: node.id, target: newRootNode.id };

      setGraphData({
        nodes: [...currentNodes, newRootNode],
        links: [...currentLinks, newLink]
      });
    } else {
      // If the root is already displayed, fetch the definitions
      let definitions;
      if (node.properties && node.properties.definitions) {
        definitions = node.properties.definitions;
      } else {
        definitions = await fetchDefinitionsByWord(wordId, L1, L2);
      }

      // Show the info bubble with the word's definitions
      setInfoBubble({ definition: definitions, position });
    }
  } catch (error) {
    console.error('Error handling word node click:', error);
  }
};

export default handleWordNodeClick;