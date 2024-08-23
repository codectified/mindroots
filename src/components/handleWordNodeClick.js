import { fetchRootByWord, fetchFormsByWord } from '../services/apiService';

const handleWordNodeClick = async (node, L1, L2, graphData, setGraphData, corpusId) => {
  try {
    console.log('Handling word node click:', node);

    // Extract wordId correctly from the node
    const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;

    console.log('wordId:', wordId);

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
      // Fetch and display the form node(s)
      const forms = await fetchFormsByWord(wordId, L1, L2);
      const newFormNodes = forms.map(form => ({
        id: `form_${form.form_id}`,
        label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
        ...form,
        type: 'form'
      }));

      const newLinks = newFormNodes.map(form => ({ source: node.id, target: form.id }));

      setGraphData({
        nodes: [...currentNodes, ...newFormNodes],
        links: [...currentLinks, ...newLinks]
      });
    }
  } catch (error) {
    console.error('Error handling word node click:', error);
  }
};

export default handleWordNodeClick;
