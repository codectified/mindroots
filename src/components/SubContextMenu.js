import React from 'react';
import { useGraphData } from '../contexts/GraphDataContext';
import { 
  fetchWordsByRootWithLexicon, 
  fetchWordsByRootWithCorpus, 
  fetchRootByWord, 
  fetchDefinitionsByWord, 
  fetchWordsByFormWithLexicon, 
  fetchWordsByFormWithCorpus 
} from '../services/apiService';

const SubContextMenu = () => {
  const { graphData, setGraphData, subContextMenu, closeSubContextMenu, setInfoBubble } = useGraphData();

  // If no node has been clicked, don't render the menu
  if (!subContextMenu) return null;

  const { node, position, L1, L2, contextFilterRoot, contextFilterForm, corpusId } = subContextMenu;
  const { x, y } = position;

  const handleAction = async (event, actionType) => {
    event.stopPropagation();

    if (actionType === 'fetchWordsByRoot' && node.type === 'root') {
      let newWords = [];
      if (contextFilterRoot === 'lexicon') {
        newWords = await fetchWordsByRootWithLexicon(node.root_id, L1, L2);
      } else {
        newWords = await fetchWordsByRootWithCorpus(node.root_id, corpusId, L1, L2);
      }

      const newNodes = newWords.map(word => ({
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
    }

    if (actionType === 'fetchWordsByForm' && node.type === 'form') {
      let newWords = [];
      if (contextFilterForm === 'lexicon') {
        newWords = await fetchWordsByFormWithLexicon(node.form_id, L1, L2);
      } else {
        newWords = await fetchWordsByFormWithCorpus(node.form_id, corpusId, L1, L2);
      }

      const newNodes = newWords.map(word => ({
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
    }

    if (actionType === 'fetchRoot' && node.type === 'word') {
      const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
      const root = await fetchRootByWord(wordId, L1, L2);

      const newRootNode = {
        id: `root_${root.root_id}`,
        label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
        ...root,
        type: 'root',
      };

      const newLink = { source: node.id, target: newRootNode.id };

      setGraphData(prev => ({
        nodes: [...prev.nodes, newRootNode],
        links: [...prev.links, newLink],
      }));
    }

    if (actionType === 'fetchDefinitions' && node.type === 'word') {
      const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
      const definitions = await fetchDefinitionsByWord(wordId, L1, L2);

      setInfoBubble({
        definition: definitions,
        position: { x, y },
      });
    }

    closeSubContextMenu();  // Close menu after action
  };

  return (
    <div style={{ top: y, left: x, position: 'absolute', zIndex: 1000, backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
      <ul>
        {node.type === 'root' && (
          <>
            <li onClick={(e) => handleAction(e, 'fetchWordsByRoot')}>Expand Root (Fetch Words)</li>
            <li>Delete Node (Placeholder)</li>
            <li>Isolate Node (Placeholder)</li>
          </>
        )}
        {node.type === 'form' && (
          <>
            <li onClick={(e) => handleAction(e, 'fetchWordsByForm')}>Expand Form (Fetch Words)</li>
            <li>Delete Node (Placeholder)</li>
            <li>Isolate Node (Placeholder)</li>
          </>
        )}
        {node.type === 'word' && (
          <>
            <li onClick={(e) => handleAction(e, 'fetchRoot')}>Expand Word (Fetch Root)</li>
            <li onClick={(e) => handleAction(e, 'fetchDefinitions')}>Show Definitions</li>
            <li>Delete Node (Placeholder)</li>
            <li>Isolate Node (Placeholder)</li>
          </>
        )}
      </ul>
    </div>
  );
};

export default SubContextMenu;