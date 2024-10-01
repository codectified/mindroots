import React, { createContext, useState, useContext } from 'react';
import { 
  fetchWordsByRootWithLexicon, 
  fetchWordsByRootWithCorpus, 
  fetchRootByWord, 
  fetchDefinitionsByWord, 
  fetchWordsByFormWithLexicon, 
  fetchWordsByFormWithCorpus 
} from '../services/apiService';
import { useNodeLimit } from './NodeLimitContext'; 

const GraphDataContext = createContext();

export const GraphDataProvider = ({ children }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [infoBubble, setInfoBubble] = useState(null); 
  const [subContextMenu, setSubContextMenu] = useState(null);  // Added state for subcontext menu

  const { limit } = useNodeLimit();

  // Method to open subcontext menu
  const openSubContextMenu = (node, position, L1, L2, contextFilterRoot, contextFilterForm, corpusId) => {
    setSubContextMenu({
      node,
      position,
      L1,
      L2,
      contextFilterRoot,
      contextFilterForm,
      corpusId
    });
  };

  // Method to close subcontext menu
  const closeSubContextMenu = () => {
    setSubContextMenu(null);
  };

  // Centralized node click handler with position handling
  const handleNodeClick = (node, L1, L2, contextFilterRoot, contextFilterForm, corpusId, event) => {
    const position = {
      x: event.clientX,
      y: event.clientY,
    };

    // Open the subcontext menu with the relevant data
    openSubContextMenu(node, position, L1, L2, contextFilterRoot, contextFilterForm, corpusId);
  };

  return (
    <GraphDataContext.Provider value={{
      graphData,
      setGraphData,
      handleNodeClick, // expose handleNodeClick
      infoBubble,
      setInfoBubble,
      subContextMenu,   // Expose subContextMenu state
      setSubContextMenu, // Expose method to manually set or modify subcontext state if needed
      openSubContextMenu, // Expose methods to open and close the menu
      closeSubContextMenu,
    }}>
      {children}
    </GraphDataContext.Provider>
  );
};

export const useGraphData = () => useContext(GraphDataContext);