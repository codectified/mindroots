import { 
  fetchWordsByRootWithLexicon, 
  fetchWordsByRootWithCorpus, 
  fetchRootByWord, 
  fetchFormsByWord, 
  fetchLaneEntry, 
  fetchWordsByFormWithLexicon, 
  fetchWordsByFormWithCorpus 
} from '../../services/apiService';

export const handleRootNodeClick = async (node, L1, L2, contextFilter, corpusId, setGraphData) => {
  try {
    let allNewWords = [];
    if (contextFilter === 'lexicon') {
      allNewWords = await fetchWordsByRootWithLexicon(node.root_id, L1, L2);
    } else if (contextFilter === corpusId) {
      allNewWords = await fetchWordsByRootWithCorpus(node.root_id, corpusId, L1, L2);
    }

    const newNodes = allNewWords.map(word => ({
      id: `word_${word.word_id}`,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`,
      ...word,
      type: 'word',
    }));

    const newLinks = newNodes.map(word => ({ source: node.id, target: word.id }));

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...newNodes],
      links: [...prev.links, ...newLinks],
    }));
  } catch (error) {
    console.error('Error fetching data for clicked root node:', error);
  }
};

export const handleFormNodeClick = async (node, L1, L2, contextFilter, corpusId, setGraphData, limit) => {
  try {
    let allNewWords = [];
    if (contextFilter === 'lexicon') {
      allNewWords = await fetchWordsByFormWithLexicon(node.form_id, L1, L2, limit);
    } else if (contextFilter === corpusId) {
      allNewWords = await fetchWordsByFormWithCorpus(node.form_id, corpusId, L1, L2, limit);
    }

    const newNodes = allNewWords.map(word => ({
      id: `word_${word.word_id}`,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`,
      ...word,
      type: 'word',
    }));

    const newLinks = newNodes.map(word => ({ source: node.id, target: word.id }));

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...newNodes],
      links: [...prev.links, ...newLinks],
    }));
  } catch (error) {
    console.error('Error fetching data for clicked form node:', error);
  }
};

export const handleWordNodeClick = async (option, node, L1, L2, corpusId, setGraphData, setInfoBubble) => {
  try {
    const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;

    switch (option) {
      case 'Fetch Root Using Word':
        const root = await fetchRootByWord(wordId, L1, L2);
        const newRootNode = {
          id: `root_${root.root_id}`,
          label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
          ...root,
          type: 'root',
        };

        const newRootLink = [{ source: node.id, target: newRootNode.id }];

        setGraphData(prev => ({
          nodes: [...prev.nodes, newRootNode],
          links: [...prev.links, ...newRootLink],
        }));
        break;

      case 'Fetch Word Definitions':
        let definitions = node.properties?.definitions || await fetchLaneEntry(wordId);
        let centerPosition = {
          x: (window.innerWidth - 200) / 2,
          y: (window.innerHeight - 100) / 2
        };

        setInfoBubble({ definition: definitions, position: centerPosition });
        break;

      case 'Fetch Form Using Word':
        const forms = await fetchFormsByWord(wordId, L1, L2);
        const newFormNodes = forms.map(form => ({
          id: `form_${form.form_id}`,
          label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
          ...form,
          type: 'form',
        }));

        const newFormLinks = newFormNodes.map(form => ({ source: node.id, target: form.id }));

        setGraphData(prev => ({
          nodes: [...prev.nodes, ...newFormNodes],
          links: [...prev.links, ...newFormLinks],
        }));
        break;

      default:
        console.error('Unknown option selected:', option);
        break;
    }
  } catch (error) {
    console.error('Error handling word node click:', error);
  }
};