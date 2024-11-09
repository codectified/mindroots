import React, { createContext, useState, useContext } from 'react';
import { 
  fetchWordsByRootWithLexicon, 
  fetchWordsByRootWithCorpus, 
  fetchRootByWord, 
  fetchLaneEntry, 
  fetchWordsByFormWithLexicon, 
  fetchWordsByFormWithCorpus 
} from '../services/apiService';
import { useNodeLimit } from './NodeLimitContext'; 
import { useFilter } from './FilterContext'; // Import the filter context



const GraphDataContext = createContext();

export const GraphDataProvider = ({ children }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [infoBubble, setInfoBubble] = useState(null); // State to manage info bubble visibility

  const { limit } = useNodeLimit();

  const { filterWordTypes } = useFilter(); // Access filterWordType

  // Function to filter Word nodes and remove associated links
  const applyFilter = (nodes, links) => {
    if (filterWordTypes.length === 0) return { nodes, links }; // No filter applied if no types are selected
  
    // Step 1: Filter nodes to keep only Word nodes that match any of the selected filterWordTypes, or keep all non-Word nodes
    const filteredNodes = nodes.filter(node => 
      node.node_type !== 'Word' || filterWordTypes.includes(node.word_type)
    );
  
    // Step 2: Create a Set of IDs for nodes that remain after filtering
    const remainingNodeIds = new Set(filteredNodes.map(node => node.id));
  
    // Step 3: Filter links to include only those that connect two nodes that remain
    const filteredLinks = links.filter(link => {
      // Check if link's source and target are objects, if so, access their IDs
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
  
      return remainingNodeIds.has(sourceId) && remainingNodeIds.has(targetId);
    });
  
    return { nodes: filteredNodes, links: filteredLinks };
  };

  const { nodes: filteredNodes, links: filteredLinks } = applyFilter(graphData.nodes, graphData.links);

  const filteredGraphData = {
    nodes: filteredNodes,
    links: filteredLinks,
  };

// Updated functions to prevent duplicates based on `word_id`
const handleRootNodeClick = async (node, L1, L2, contextFilter, corpusId) => {
  try {
    let allNewWords = [];
    if (contextFilter === 'lexicon') {
      allNewWords = await fetchWordsByRootWithLexicon(node.root_id, L1, L2);
    } else if (contextFilter === corpusId) {
      allNewWords = await fetchWordsByRootWithCorpus(node.root_id, corpusId, L1, L2);
    }

    const currentWordIds = new Set(graphData.nodes.map(n => n.word_id)); // Existing `word_id`s
    const newNodes = allNewWords
      .filter(word => !currentWordIds.has(word.word_id)) // Filter out duplicates
      .map(word => ({
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

const handleFormNodeClick = async (node, L1, L2, contextFilter, corpusId) => {
  try {
    let allNewWords = [];
    if (contextFilter === 'lexicon') {
      allNewWords = await fetchWordsByFormWithLexicon(node.form_id, L1, L2, limit);
    } else if (contextFilter === corpusId) {
      allNewWords = await fetchWordsByFormWithCorpus(node.form_id, corpusId, L1, L2, limit);
    }

    const currentWordIds = new Set(graphData.nodes.map(n => n.word_id));
    const newNodes = allNewWords
      .filter(word => !currentWordIds.has(word.word_id))
      .map(word => ({
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
const handleWordNodeClick = async (node, L1, L2, corpusId) => {
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

      // Fix: Wrap newLink in an array
      const newLink = [{ source: node.id, target: newRootNode.id }];

      setGraphData(prev => ({
        nodes: [...prev.nodes, newRootNode],
        links: [...prev.links, ...newLink], // newLink is now an array
      }));
    } else {
      let definitions = node.properties?.definitions || await fetchLaneEntry(wordId, L1, L2);
      
      // Set the info bubble position to the center of the screen
      let centerPosition = {
        x: (window.innerWidth - 200) / 2,  // Assuming bubble width is 200px
        y: (window.innerHeight - 100) / 2  // Assuming bubble height is 100px
      };

      setInfoBubble({ definition: definitions, position: centerPosition });
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
      graphData: filteredGraphData,
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