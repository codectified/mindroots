import { fetchWordsByFormWithLexicon, fetchWordsByFormWithCorpus } from '../services/apiService';

const handleFormNodeClick = async (node, script, rootData, setRootData, contextFilter, corpusId) => {
  try {
    console.log('Fetching words for form ID:', node.form_id);
    let allNewWords = [];

    if (contextFilter === 'lexicon') {
      allNewWords = await fetchWordsByFormWithLexicon(node.form_id, script);
    } else if (contextFilter === corpusId) {
      allNewWords = await fetchWordsByFormWithCorpus(node.form_id, corpusId, script);
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

    console.log('New rootData after fetching form data:', newData);
    setRootData(newData);
  } catch (error) {
    console.error('Error fetching data for clicked form node:', error);
  }
};

export default handleFormNodeClick;
