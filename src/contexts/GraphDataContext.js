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

  const { filterWordTypes, hideFormNodes } = useFilter(); // Access filterWordType

  // Function to filter Word nodes, Form nodes, and remove associated links
  const applyFilter = (nodes, links) => {
    console.log("Filter word types:", filterWordTypes);
    console.log("Hide form nodes:", hideFormNodes);
  
    const filteredNodes = nodes.filter(node => {
      const isWordNode = node.node_type === 'Word';
      const isFormNode = node.node_type === 'Form';
  
      // Determine if the node should be included based on the filters
      const includeNode =
        (!isWordNode || filterWordTypes.length === 0 || filterWordTypes.includes(node.word_type)) &&
        (!isFormNode || !hideFormNodes); // Hide only Form nodes if hideFormNodes is true
  
      console.log(`Node ${node.id} (${node.node_type}) included: ${includeNode}`);
      return includeNode;
    });
  
    // Step 2: Create a Set of IDs for nodes that remain after filtering
    const remainingNodeIds = new Set(filteredNodes.map(node => node.id));
    console.log("Remaining Node IDs after filtering:", Array.from(remainingNodeIds));
  
    // Step 3: Filter links to include only those that connect two nodes that remain
    const filteredLinks = links.filter(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
  
      const keepLink = remainingNodeIds.has(sourceId) && remainingNodeIds.has(targetId);
      console.log(`Link ${sourceId} -> ${targetId} kept: ${keepLink}`);
      return keepLink;
    });
    
    console.log("Final filtered nodes:", filteredNodes);
    console.log("Final filtered links:", filteredLinks);
  
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
// 1) Updated handleWordNodeClick
const handleWordNodeClick = async (
  node,
  L1,
  L2,
  corpusId,
  event
) => {
  try {
    // Determine the numeric word ID
    const wordId = node.word_id?.low !== undefined
      ? node.word_id.low
      : node.word_id;

    // Check if the corresponding root is already displayed
    const alreadyHasRoot = graphData.nodes.some(
      n => n.type === 'root' && n.root_id === node.root_id
    );

    if (!alreadyHasRoot) {
      // Fetch and add the missing root
      const root = await fetchRootByWord(wordId, L1, L2);
      const newRootNode = {
        id: `root_${root.root_id}`,
        label: L2 === 'off'
          ? root[L1]
          : `${root[L1]} / ${root[L2]}`,
        ...root,
        type: 'root',
      };
      // Link from word to root
      const newLink = [{ source: node.id, target: newRootNode.id }];

      setGraphData(prev => ({
        nodes: [...prev.nodes, newRootNode],
        links: [...prev.links, ...newLink],
      }));
    } else {
      // Fetch or read definitions
      const definitions = node.properties?.definitions ||
        await fetchLaneEntry(wordId, L1, L2);

      // Position under the click, including scroll offset
      const position = {
        x: event.pageX,
        y: event.pageY,
      };

      setInfoBubble({
        definition: definitions,
        position,
      });
    }
  } catch (error) {
    console.error('Error handling word node click:', error);
  }
};

  // Centralized node click handler with position handling
// 2) Updated handleNodeClick (central dispatcher)
const handleNodeClick = async (
  node,
  L1,
  L2,
  contextFilterRoot,
  contextFilterForm,
  corpusId,
  event
) => {
  // Always capture the true click point
  const position = {
    x: event.pageX,
    y: event.pageY,
  };

  if (node.type === 'form') {
    await handleFormNodeClick(
      node,
      L1,
      L2,
      contextFilterForm,
      corpusId
    );
  } else if (node.type === 'root') {
    await handleRootNodeClick(
      node,
      L1,
      L2,
      contextFilterRoot,
      corpusId
    );
  } else if (node.type === 'word') {
    // Pass the event through so handleWordNodeClick can read pageX/pageY
    await handleWordNodeClick(
      node,
      L1,
      L2,
      corpusId,
      event
    );
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