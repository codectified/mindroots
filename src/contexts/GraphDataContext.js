import React, { createContext, useState, useContext } from 'react';
import { 
  fetchWordsByRootWithLexicon, 
  fetchWordsByRootWithCorpus, 
  fetchRootByWord, 
  fetchFormsByWord, 
  fetchLaneEntry, 
  fetchWordsByFormWithLexicon, 
  fetchWordsByFormWithCorpus 
} from '../services/apiService';
import { useNodeLimit } from './NodeLimitContext'; 

// Create Context
const GraphDataContext = createContext();

// Context Menu Component
const ContextMenu = ({ position, node, onOptionSelect }) => {
  const handleOptionClick = (option) => {
    onOptionSelect(option);
  };

  // Define options based on node type
  let options = [];
  if (node.type === 'root') {
    options = ['Fetch related words (Root)'];
  } else if (node.type === 'form') {
    options = ['Fetch related words (Form)'];
  } else if (node.type === 'word') {
    options = [
      'Fetch Root Using Word',
      'Fetch Form Using Word',
      'Fetch Word Definitions'
    ];
  }

  return (
    <div style={{
      position: 'absolute',
      top: position.y,
      left: position.x,
      background: '#fff',
      border: '1px solid #ccc',
      padding: '10px',
      zIndex: 1000
    }}>
      {options.map(option => (
        <div key={option} onClick={() => handleOptionClick(option)}>
          {option}
        </div>
      ))}
    </div>
  );
};

// Graph Data Provider
export const GraphDataProvider = ({ children }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [infoBubble, setInfoBubble] = useState(null); // State to manage info bubble visibility
  const [contextMenu, setContextMenu] = useState(null); // State for context menu

  const { limit } = useNodeLimit();

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

  // Handle word node click
  const handleWordNodeClick = async (option, node, L1, L2, corpusId) => {
    try {
      const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;

      switch (option) {
        case 'Fetch Root Using Word':
          // Fetch root by word
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
          // Fetch word definitions
          let definitions = node.properties?.definitions || await fetchLaneEntry(wordId);
          let centerPosition = {
            x: (window.innerWidth - 200) / 2,  // Center of screen
            y: (window.innerHeight - 100) / 2
          };

          setInfoBubble({ definition: definitions, position: centerPosition });
          break;

        case 'Fetch Form Using Word':
          // Fetch forms by word
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

  // Centralized node click handler
  const handleNodeClick = (node, L1, L2, contextFilterRoot, contextFilterForm, corpusId, event) => {
    const position = {
      x: event.clientX,
      y: event.clientY,
    };

    // Show context menu for word, root, and form nodes
    if (node.type === 'root' || node.type === 'form' || node.type === 'word') {
      setContextMenu({ position, node, L1, L2, contextFilterRoot, contextFilterForm, corpusId });
    }
  };

  // Handle context menu selection
  const handleContextMenuSelect = async (option, node, L1, L2, contextFilterRoot, contextFilterForm, corpusId) => {
    setContextMenu(null); // Hide the menu

    if (node.type === 'root' && option === 'Fetch related words (Root)') {
      await handleRootNodeClick(node, L1, L2, contextFilterRoot, corpusId);
    } else if (node.type === 'form' && option === 'Fetch related words (Form)') {
      await handleFormNodeClick(node, L1, L2, contextFilterForm, corpusId);
    } else if (node.type === 'word') {
      await handleWordNodeClick(option, node, L1, L2, corpusId);
    }
  };

  return (
    <GraphDataContext.Provider value={{
      graphData,
      setGraphData,
      handleNodeClick,
      handleRootNodeClick,
      handleFormNodeClick,
      handleWordNodeClick,
      infoBubble,
      setInfoBubble
    }}>
      {children}

      {contextMenu && (
        <ContextMenu 
          position={contextMenu.position}
          node={contextMenu.node}
          onOptionSelect={(option) =>
            handleContextMenuSelect(option, contextMenu.node, contextMenu.L1, contextMenu.L2, contextMenu.contextFilterRoot, contextMenu.contextFilterForm, contextMenu.corpusId)
          }
        />
      )}
    </GraphDataContext.Provider>
  );
};

// Hook to use GraphDataContext
export const useGraphData = () => useContext(GraphDataContext);