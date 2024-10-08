import React, { createContext, useState, useContext } from 'react';
import { useNodeLimit } from './NodeLimitContext'; 
import ContextMenu from '../components/utils/ContextMenu';
import { 
  handleRootNodeClick, 
  handleFormNodeClick, 
  handleWordNodeClick 
} from '../components/utils/nodeHandlers';

const GraphDataContext = createContext();

export const GraphDataProvider = ({ children }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [infoBubble, setInfoBubble] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [mode, setMode] = useState('guided'); // State for mode (guided or advanced)
  const { limit } = useNodeLimit();

  // Centralized node click handler
  const handleNodeClick = (node, L1, L2, contextFilterRoot, contextFilterForm, corpusId, event) => {
    const position = {
      x: event.clientX,
      y: event.clientY,
    };

    if (mode === 'advanced') {
      // Show context menu in advanced mode
      if (node.type === 'root' || node.type === 'form' || node.type === 'word') {
        setContextMenu({ position, node, L1, L2, contextFilterRoot, contextFilterForm, corpusId });
      }
    } else {
      // In guided mode, call handlers directly based on node type
      if (node.type === 'root') {
        handleRootNodeClick(node, L1, L2, contextFilterRoot, corpusId, setGraphData);
      } else if (node.type === 'form') {
        handleFormNodeClick(node, L1, L2, contextFilterForm, corpusId, setGraphData, limit);
      } else if (node.type === 'word') {
        // Call handleWordNodeClick directly with 'guided' logic
        handleWordNodeClick(null, node, L1, L2, corpusId, setGraphData, setInfoBubble, mode);
      }
    }
  };

  // Handle context menu selection
  const handleContextMenuSelect = async (option, node, L1, L2, contextFilterRoot, contextFilterForm, corpusId) => {
    setContextMenu(null);

    if (node.type === 'root' && option === 'Fetch related words (Root)') {
      await handleRootNodeClick(node, L1, L2, contextFilterRoot, corpusId, setGraphData);
    } else if (node.type === 'form' && option === 'Fetch related words (Form)') {
      await handleFormNodeClick(node, L1, L2, contextFilterForm, corpusId, setGraphData, limit);
    } else if (node.type === 'word') {
      await handleWordNodeClick(option, node, L1, L2, corpusId, setGraphData, setInfoBubble, mode);
    }
  };

  return (
    <GraphDataContext.Provider value={{
      graphData,
      setGraphData,
      handleNodeClick,
      mode,
      setMode, // Expose setMode to be used elsewhere
      infoBubble,
      setInfoBubble
    }}>
      {children}

      {contextMenu && mode === 'advanced' && (
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

export const useGraphData = () => useContext(GraphDataContext);