import { fetchWordsByRootWithLexicon, fetchWordsByRootWithCorpus } from '../services/apiService';

const handleRootNodeClick = async (node, script, rootData, setRootData, contextFilter, corpusId) => {
  try {
    console.log('Fetching words for root ID:', node.root_id);
    let allNewWords = [];

    if (contextFilter === 'lexicon') {
      allNewWords = await fetchWordsByRootWithLexicon(node.root_id, script);
    } else if (contextFilter === corpusId) {
      allNewWords = await fetchWordsByRootWithCorpus(node.root_id, corpusId, script);
    }

    const newNodes = allNewWords.map(word => ({
      id: `word_${word.word_id}`,
      label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script],
      ...word,
      type: 'word'
    }));

    const newLinks = newNodes.map(word => ({ source: node.id, target: word.id }));

    const newData = {
      nodes: [...rootData.nodes, ...newNodes],
      links: [...rootData.links, ...newLinks]
    };

    console.log('New rootData after fetching root data:', newData);
    setRootData(newData);
  } catch (error) {
    console.error('Error fetching data for clicked root node:', error);
  }
};

export default handleRootNodeClick;
