import { fetchWordsByRootWithLexicon, fetchWordsByRootWithCorpus } from '../services/apiService';

const handleRootNodeClick = async (node, L1, L2, graphData, setGraphData, contextFilter, corpusId) => {
  try {
    console.log('Fetching words for root ID:', node.root_id);
    let allNewWords = [];

    if (contextFilter === 'lexicon') {
      allNewWords = await fetchWordsByRootWithLexicon(node.root_id, L1, L2);
    } else if (contextFilter === corpusId) {
      allNewWords = await fetchWordsByRootWithCorpus(node.root_id, corpusId, L1, L2);
    }

    const currentNodes = graphData.nodes || [];
    const currentLinks = graphData.links || [];

    const newNodes = allNewWords.map(word => ({
      id: `word_${word.word_id}`,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`,
      ...word,
      type: 'word'
    }));

    const newLinks = newNodes.map(word => ({ source: node.id, target: word.id }));

    setGraphData({ nodes: [...currentNodes, ...newNodes], links: [...currentLinks, ...newLinks] });
  } catch (error) {
    console.error('Error fetching data for clicked root node:', error);
  }
};

export default handleRootNodeClick;
