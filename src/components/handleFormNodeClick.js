import { fetchWordsByFormWithLexicon, fetchWordsByFormWithCorpus } from '../services/apiService';

const handleFormNodeClick = async (node, L1, L2, graphData, setGraphData, contextFilter, corpusId) => {
  try {
    console.log('Fetching words for form ID:', node.form_id);
    let allNewWords = [];

    // Fetch words based on context filter
    if (contextFilter === 'lexicon') {
      allNewWords = await fetchWordsByFormWithLexicon(node.form_id, L1, L2);
    } else if (contextFilter === corpusId) {
      allNewWords = await fetchWordsByFormWithCorpus(node.form_id, corpusId, L1, L2);
    }

    // Map new words to nodes
    const newNodes = allNewWords.map(word => ({
      id: `word_${word.word_id}`,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`,
      ...word,
      type: 'word'
    }));

    // Create links from the form node to the new word nodes
    const newLinks = newNodes.map(word => ({ source: node.id, target: word.id }));

    // Update the graph data
    const newData = {
      nodes: [...graphData.nodes, ...newNodes],
      links: [...graphData.links, ...newLinks]
    };

    console.log('New graphData after fetching form data:', newData);
    setGraphData(newData);
  } catch (error) {
    console.error('Error fetching data for clicked form node:', error);
  }
};

export default handleFormNodeClick;
