import { fetchRootByWord, fetchFormsByWord } from '../services/apiService';

const handleWordNodeClick = async (node, script, graphData, setGraphData, corpusId) => {
  try {
    console.log('Handling word node click:', node);

    // Check if the root node is already displayed
    const rootNodeDisplayed = graphData.nodes.some(n => n.type === 'root' && n.root_id === node.root_id);

    if (!rootNodeDisplayed) {
      // Fetch and display the root node
      const root = await fetchRootByWord(node.word_id, script);
      const newRootNode = {
        id: `root_${root.root_id}`,
        label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script],
        ...root,
        type: 'root'
      };

      const newLink = { source: node.id, target: newRootNode.id };

      const newData = {
        nodes: [...graphData.nodes, newRootNode],
        links: [...graphData.links, newLink]
      };

      setGraphData(newData);
    } else {
      // Fetch and display the form node(s)
      const forms = await fetchFormsByWord(node.word_id, script);
      const newFormNodes = forms.map(form => ({
        id: `form_${form.form_id}`,
        label: script === 'both' ? `${form.arabic} / ${form.english}` : form[script],
        ...form,
        type: 'form'
      }));

      const newLinks = newFormNodes.map(form => ({ source: node.id, target: form.id }));

      const newData = {
        nodes: [...graphData.nodes, ...newFormNodes],
        links: [...graphData.links, ...newLinks]
      };

      setGraphData(newData);
    }
  } catch (error) {
    console.error('Error handling word node click:', error);
  }
};

export default handleWordNodeClick;

