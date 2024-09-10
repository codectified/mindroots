import React, { createContext, useState, useContext } from 'react';
import { 
  fetchWordsByRootWithLexicon, 
  fetchWordsByRootWithCorpus, 
  fetchRootByWord, 
  fetchDefinitionsByWord, 
  fetchWordsByFormWithLexicon, 
  fetchWordsByFormWithCorpus 
} from '../services/apiService';

const GraphDataContext = createContext();

export const GraphDataProvider = ({ children }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [infoBubble, setInfoBubble] = useState(null); // State to manage info bubble visibility

  // Handle root node click
  const handleRootNodeClick = async (node, L1, L2, contextFilter, corpusId) => {
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

  // Handle form node click
  const handleFormNodeClick = async (node, L1, L2, contextFilter, corpusId) => {
    try {
      let allNewWords = [];
      if (contextFilter === 'lexicon') {
        allNewWords = await fetchWordsByFormWithLexicon(node.form_id, L1, L2);
      } else if (contextFilter === corpusId) {
        allNewWords = await fetchWordsByFormWithCorpus(node.form_id, corpusId, L1, L2);
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

  // Handle word node click
  const handleWordNodeClick = async (node, L1, L2, corpusId, position) => {
    try {
      const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
      const currentNodes = graphData.nodes || [];

      const rootNodeDisplayed = currentNodes.some(n => n.type === 'root' && n.root_id === node.root_id);

      if (!rootNodeDisplayed) {
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
      } else {
        let definitions = node.properties?.definitions || await fetchDefinitionsByWord(wordId, L1, L2);
        setInfoBubble({ definition: definitions, position });
      }
    } catch (error) {
      console.error('Error handling word node click:', error);
    }
  };

  // Centralized node click handler with position handling
  const handleNodeClick = async (node, L1, L2, contextFilterRoot, contextFilterForm, corpusId, event) => {
    const position = {
      x: event.clientX,
      y: event.clientY,
    };

    if (node.type === 'form') {
      await handleFormNodeClick(node, L1, L2, contextFilterForm, corpusId);
    } else if (node.type === 'root') {
      await handleRootNodeClick(node, L1, L2, contextFilterRoot, corpusId);
    } else if (node.type === 'word') {
      await handleWordNodeClick(node, L1, L2, corpusId, position);
    }
  };

  return (
    <GraphDataContext.Provider value={{
      graphData,
      setGraphData,
      handleNodeClick, // expose handleNodeClick
      handleRootNodeClick,
      handleFormNodeClick,
      handleWordNodeClick,
      infoBubble,
      setInfoBubble
    }}>
      {children}
    </GraphDataContext.Provider>
  );
};

export const useGraphData = () => useContext(GraphDataContext);