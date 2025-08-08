import React, { createContext, useState, useContext } from 'react';
import { 
  fetchLaneEntry, 
  fetchHansWehrEntry,
  fetchCorpusItemEntry,
  fetchRootEntry,
  expandGraph,
  summarizeNodeContent,
  reportNodeIssue
} from '../services/apiService';
import { useNodeLimit } from './NodeLimitContext'; 
import { useFilter } from './FilterContext'; // Import the filter context
import { useScript } from './ScriptContext'; // Import the script context for language settings
import { useFormFilter } from './FormFilterContext'; // Import the form filter context
import { useContextFilter } from './ContextFilterContext'; // Import the context filter context



const GraphDataContext = createContext();

// Normalize node structure to ensure consistency across different API sources
const normalizeNode = (node) => {
  if (!node) return null;
  
  // Ensure node has required fields
  const normalized = {
    ...node,
    // Ensure id exists and follows consistent format
    id: node.id || `${node.type}_${node.word_id || node.root_id || node.form_id || node.item_id}`,
    // Ensure node_type exists (some legacy nodes might be missing this)
    node_type: node.node_type || (node.type ? node.type.charAt(0).toUpperCase() + node.type.slice(1) : 'Unknown'),
    // Ensure type exists and is lowercase
    type: node.type || (node.node_type ? node.node_type.toLowerCase() : 'unknown')
  };
  
  return normalized;
};

// Normalize an array of nodes
const normalizeNodes = (nodes) => {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(normalizeNode).filter(Boolean);
};

export const GraphDataProvider = ({ children }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [infoBubble, setInfoBubble] = useState(null); // State to manage info bubble visibility
  const [contextMenu, setContextMenu] = useState(null); // State to manage context menu visibility
  const [corpusItemEntries, setCorpusItemEntries] = useState({}); // Cache for corpus item entries
  const [rootEntries, setRootEntries] = useState({}); // Cache for root entries
  const [wordClickStates, setWordClickStates] = useState({}); // Track click progression for word nodes

  const { limit } = useNodeLimit();
  const { L1, L2 } = useScript(); // Get current language settings
  const { filterWordTypes, hideFormNodes } = useFilter(); // Access filterWordType
  const { selectedFormClassifications } = useFormFilter(); // Access form classification filter
  const { contextFilterRoot, contextFilterForm } = useContextFilter(); // Access context filter

  // Function to filter Word nodes, Form nodes, and remove associated links
  const applyFilter = (nodes, links) => {
    console.log("Filter word types:", filterWordTypes);
    console.log("Hide form nodes:", hideFormNodes);
    console.log("Selected form classifications:", selectedFormClassifications);
  
    const filteredNodes = nodes.filter(node => {
      const isWordNode = node.node_type === 'Word';
      const isFormNode = node.node_type === 'Form';
  
      // Determine if the node should be included based on the filters
      let includeNode = true;
      
      // Apply word type filter
      if (isWordNode && filterWordTypes.length > 0 && !filterWordTypes.includes(node.word_type)) {
        includeNode = false;
      }
      
      // Apply general form node filter
      if (isFormNode && hideFormNodes) {
        includeNode = false;
      }
      
      // Apply form classification filter (case-insensitive comparison)
      if (isFormNode && selectedFormClassifications.length > 0) {
        const nodeClassification = node.classification;
        const nodeClassificationNormalized = nodeClassification ? nodeClassification.toLowerCase() : '';
        const selectedClassificationsNormalized = selectedFormClassifications.map(c => c.toLowerCase());
        console.log(`Checking form node ${node.id}: classification="${nodeClassification}", selectedFormClassifications=[${selectedFormClassifications.join(', ')}], includes=${selectedClassificationsNormalized.includes(nodeClassificationNormalized)}`);
        if (!nodeClassification || !selectedClassificationsNormalized.includes(nodeClassificationNormalized)) {
          includeNode = false;
        }
      }
  
      console.log(`Node ${node.id} (${node.node_type}, classification: ${node.classification}) included: ${includeNode}`);
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

// Updated functions to use consolidated expand route and handle links
const handleRootNodeClick = async (node, L1, L2, contextFilter, corpusId, position) => {
  console.log('handleRootNodeClick called with:', { node, L1, L2, contextFilter, corpusId });
  
  try {
    const rootId = node.root_id?.low !== undefined ? node.root_id.low : node.root_id;
    const options = { L1, L2, limit: 100 };
    
    // Add corpus filter if contextFilter is set to a corpus ID (not 'lexicon')
    if (contextFilter && contextFilter !== 'lexicon') {
      options.corpus_id = contextFilter;
      console.log('Adding corpus filter:', contextFilter);
    } else {
      console.log('No corpus filter - using lexicon scope');
    }

    console.log('Calling expandGraph with:', 'root', rootId, 'word', options);
    const result = await expandGraph('root', rootId, 'word', options);
    console.log('expandGraph returned:', result);

    if (!result || !result.nodes || !result.links) {
      throw new Error('Invalid response format from expandGraph');
    }

    const { nodes: rawNodes, links: newLinks, info } = result;
    
    // Handle empty results with user feedback
    if (rawNodes.length === 0) {
      if (info && info.corpusFiltered) {
        console.log(`No words found for root ${rootId} in corpus ${contextFilter}`);
        setInfoBubble({ 
          definition: `No words found for this root in the selected corpus. The root exists but has no words in the current corpus context.`, 
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 } 
        });
      } else {
        console.log(`No words found for root ${rootId}`);
        setInfoBubble({ 
          definition: `No words found for this root.`, 
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 } 
        });
      }
      return; // Don't update graph data if no results
    }

    // Normalize nodes to ensure consistent structure
    const newNodes = normalizeNodes(rawNodes);

    // Filter out duplicate nodes based on node ID
    const currentNodeIds = new Set(graphData.nodes.map(n => n.id));
    const filteredNewNodes = newNodes.filter(node => !currentNodeIds.has(node.id));
    
    // Filter out duplicate links
    const currentLinkIds = new Set(graphData.links.map(link => `${link.source}-${link.target}-${link.type || ''}`));
    const filteredNewLinks = newLinks.filter(link => !currentLinkIds.has(`${link.source}-${link.target}-${link.type || ''}`));

    console.log(`Adding ${filteredNewNodes.length} new nodes and ${filteredNewLinks.length} new links`);
    console.log('Current node IDs:', Array.from(currentNodeIds));
    console.log('New node IDs being added:', filteredNewNodes.map(n => n.id));

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...filteredNewNodes],
      links: [...prev.links, ...filteredNewLinks],
    }));
  } catch (error) {
    console.error('Root expansion failed:', error);
    // Fallback removed to ensure consistent node structure
  }
};

const handleFormNodeClick = async (node, L1, L2, contextFilter, corpusId, position) => {
  console.log('handleFormNodeClick called with:', { node, L1, L2, contextFilter, corpusId });
  
  try {
    const formId = node.form_id?.low !== undefined ? node.form_id.low : node.form_id;
    const options = { L1, L2, limit };
    
    // Add corpus filter if contextFilter is set to a corpus ID (not 'lexicon')
    if (contextFilter && contextFilter !== 'lexicon') {
      options.corpus_id = contextFilter;
      console.log('Adding corpus filter:', contextFilter);
    } else {
      console.log('No corpus filter - using lexicon scope');
    }

    console.log('Calling expandGraph with:', 'form', formId, 'word', options);
    const result = await expandGraph('form', formId, 'word', options);
    console.log('expandGraph returned:', result);

    if (!result || !result.nodes || !result.links) {
      throw new Error('Invalid response format from expandGraph');
    }

    const { nodes: rawNodes, links: newLinks, info } = result;
    
    // Handle empty results with user feedback
    if (rawNodes.length === 0) {
      if (info && info.corpusFiltered) {
        console.log(`No words found for form ${formId} in corpus ${contextFilter}`);
        setInfoBubble({ 
          definition: `No words found for this form in the selected corpus. The form exists but has no words in the current corpus context.`, 
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 } 
        });
      } else {
        console.log(`No words found for form ${formId}`);
        setInfoBubble({ 
          definition: `No words found for this form.`, 
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 } 
        });
      }
      return; // Don't update graph data if no results
    }

    // Normalize nodes to ensure consistent structure
    const newNodes = normalizeNodes(rawNodes);

    // Filter out duplicate nodes based on node ID
    const currentNodeIds = new Set(graphData.nodes.map(n => n.id));
    const filteredNewNodes = newNodes.filter(node => !currentNodeIds.has(node.id));
    
    // Filter out duplicate links
    const currentLinkIds = new Set(graphData.links.map(link => `${link.source}-${link.target}-${link.type || ''}`));
    const filteredNewLinks = newLinks.filter(link => !currentLinkIds.has(`${link.source}-${link.target}-${link.type || ''}`));

    console.log(`Adding ${filteredNewNodes.length} new nodes and ${filteredNewLinks.length} new links`);
    console.log('Current node IDs:', Array.from(currentNodeIds));
    console.log('New node IDs being added:', filteredNewNodes.map(n => n.id));

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...filteredNewNodes],
      links: [...prev.links, ...filteredNewLinks],
    }));
  } catch (error) {
    console.error('Form expansion failed:', error);
    // Fallback removed to ensure consistent node structure
  }
};

// Handle word node expansion to corpus items
const handleWordToCorpusItemExpansion = async (node, L1, L2, contextFilter, position) => {
  console.log('handleWordToCorpusItemExpansion called with:', { node, L1, L2, contextFilter });
  
  try {
    const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
    const options = { L1, L2, limit };
    
    // Add corpus filter if contextFilter is set to a corpus ID (not 'lexicon')
    if (contextFilter && contextFilter !== 'lexicon') {
      options.corpus_id = contextFilter;
      console.log('Adding corpus filter for corpusitem expansion:', contextFilter);
    } else {
      console.log('No corpus filter for corpusitem expansion - using lexicon scope');
    }

    console.log('Calling expandGraph with:', 'word', wordId, 'corpusitem', options);
    const result = await expandGraph('word', wordId, 'corpusitem', options);
    console.log('expandGraph returned:', result);

    if (!result || !result.nodes || !result.links) {
      throw new Error('Invalid response format from expandGraph');
    }

    const { nodes: rawNodes, links: newLinks, info } = result;
    
    // Handle empty results - no InfoBubble needed
    if (rawNodes.length === 0) {
      console.log(`No corpus items found for word ${wordId}`);
      return; // Don't update graph data if no results, no InfoBubble shown
    }

    // Normalize nodes to ensure consistent structure
    const newNodes = normalizeNodes(rawNodes);

    // Filter out duplicate nodes based on node ID
    const currentNodeIds = new Set(graphData.nodes.map(n => n.id));
    const filteredNewNodes = newNodes.filter(node => !currentNodeIds.has(node.id));
    
    // Filter out duplicate links
    const currentLinkIds = new Set(graphData.links.map(link => `${link.source}-${link.target}-${link.type || ''}`));
    const filteredNewLinks = newLinks.filter(link => !currentLinkIds.has(`${link.source}-${link.target}-${link.type || ''}`));

    console.log(`Adding ${filteredNewNodes.length} new corpus item nodes and ${filteredNewLinks.length} new links`);
    console.log('Current node IDs:', Array.from(currentNodeIds));
    console.log('New corpus item node IDs being added:', filteredNewNodes.map(n => n.id));

    setGraphData(prev => ({
      nodes: [...prev.nodes, ...filteredNewNodes],
      links: [...prev.links, ...filteredNewLinks],
    }));
  } catch (error) {
    console.error('Word to corpus item expansion failed:', error);
    
    // Check if it's the backend unsupported combination error
    if (error.message && error.message.includes('Invalid source/target type combination')) {
      console.warn('Backend does not yet support word->corpusitem expansion. Backend update needed.');
      console.warn('Supported combinations:', error.supportedCombinations || 'See backend error for details');
      return; // Silently fail - no InfoBubble for unsupported feature
    }
    
    // For other errors, don't show InfoBubble either - just log
    console.error('Unexpected error during corpus item expansion:', error);
  }
};

// Handle word node click with 3-click progression
const handleWordNodeClick = async (
  node,
  L1,
  L2,
  contextFilterForm, // Use form context filter for word expansions
  corpusId,
  event,
  position
) => {
  try {
    const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
    const nodeKey = node.id;
    
    // Get current click state for this word (default to 0)
    const currentClickState = wordClickStates[nodeKey] || 0;
    console.log(`Word node ${nodeKey} click state: ${currentClickState}`);

    if (currentClickState === 0) {
      // FIRST CLICK: Expand to root node(s)
      console.log('First click: expanding to root');
      
      // Check if the corresponding root is already displayed
      const alreadyHasRoot = graphData.nodes.some(
        n => n.type === 'root' && n.root_id === node.root_id
      );

      if (!alreadyHasRoot) {
        // Use the universal expand route to get the root
        const options = { L1, L2, limit: 1 };
        try {
          const result = await expandGraph('word', wordId, 'root', options);
          
          if (result && result.nodes && result.links) {
            const { nodes: rawNodes, links: newLinks } = result;
            
            if (rawNodes.length > 0) {
              // Normalize nodes to ensure consistent structure
              const newNodes = normalizeNodes(rawNodes);

              // Filter out duplicate nodes based on node ID
              const currentNodeIds = new Set(graphData.nodes.map(n => n.id));
              const filteredNewNodes = newNodes.filter(node => !currentNodeIds.has(node.id));
              
              // Filter out duplicate links
              const currentLinkIds = new Set(graphData.links.map(link => `${link.source}-${link.target}-${link.type || ''}`));
              const filteredNewLinks = newLinks.filter(link => !currentLinkIds.has(`${link.source}-${link.target}-${link.type || ''}`));

              setGraphData(prev => ({
                nodes: [...prev.nodes, ...filteredNewNodes],
                links: [...prev.links, ...filteredNewLinks],
              }));
            }
          }
        } catch (error) {
          console.error('Word to root expansion failed during 3-click progression:', error);
        }
      }
      
      // Update click state to 1
      setWordClickStates(prev => ({
        ...prev,
        [nodeKey]: 1
      }));
      
    } else if (currentClickState === 1) {
      // SECOND CLICK: Show InfoBubble with definitions
      console.log('Second click: showing definitions');
      
      const definitions = node.properties?.definitions ||
        await fetchLaneEntry(wordId, L1, L2);
      setInfoBubble({
        definition: definitions,
        position,
      });
      
      // Update click state to 2
      setWordClickStates(prev => ({
        ...prev,
        [nodeKey]: 2
      }));
      
    } else if (currentClickState === 2) {
      // THIRD CLICK: Expand to corpus items
      console.log('Third click: expanding to corpus items');
      
      // Check if corpus items are already connected to this word
      const hasCorpusItems = graphData.links.some(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return (sourceId === node.id || targetId === node.id) && 
               (link.type === 'USED_IN' || link.type === 'APPEARS_IN');
      });
      
      if (!hasCorpusItems) {
        await handleWordToCorpusItemExpansion(node, L1, L2, contextFilterForm, position);
      } else {
        console.log('Corpus items already expanded for this word');
        setInfoBubble({
          definition: 'Corpus items are already displayed for this word.',
          position,
        });
      }
      
      // Reset click state to 0 for next cycle
      setWordClickStates(prev => ({
        ...prev,
        [nodeKey]: 0
      }));
      
    }
  } catch (error) {
    console.error('Error handling word node click:', error);
    // Reset click state on error
    setWordClickStates(prev => ({
      ...prev,
      [node.id]: 0
    }));
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
      corpusId,
      position
    );
  } else if (node.type === 'root') {
    await handleRootNodeClick(
      node,
      L1,
      L2,
      contextFilterRoot,
      corpusId,
      position
    );
  } else if (node.type === 'word') {
    // Pass the event through so handleWordNodeClick can read pageX/pageY
    await handleWordNodeClick(
      node,
      L1,
      L2,
      contextFilterForm, // Use form context filter for word expansions
      corpusId,
      event,
      position
    );
  }
};

// Function to prefetch corpus item entry when context menu is opened
const prefetchCorpusItemEntry = async (node) => {
  if (node.type === 'name') { // corpus item nodes have type 'name'
    const corpusItemId = node.item_id?.low !== undefined ? node.item_id.low : node.item_id;
    const corpusId = node.corpus_id?.low !== undefined ? node.corpus_id.low : node.corpus_id;
    const entryKey = `${corpusId}_${corpusItemId}`;
    
    // Only fetch if not already cached
    if (!corpusItemEntries[entryKey]) {
      try {
        const entry = await fetchCorpusItemEntry(corpusId, corpusItemId);
        setCorpusItemEntries(prev => ({
          ...prev,
          [entryKey]: entry
        }));
      } catch (error) {
        // If entry doesn't exist or fails to fetch, cache null to avoid repeated attempts
        console.log('No entry found for corpus item:', entryKey);
        setCorpusItemEntries(prev => ({
          ...prev,
          [entryKey]: null
        }));
      }
    }
  }
};

// Function to prefetch root entry when context menu is opened
const prefetchRootEntry = async (node) => {
  if (node.type === 'root') {
    const rootId = node.root_id?.low !== undefined ? node.root_id.low : node.root_id;
    
    // Only fetch if not already cached
    if (!rootEntries[rootId]) {
      try {
        const entry = await fetchRootEntry(rootId);
        setRootEntries(prev => ({
          ...prev,
          [rootId]: entry
        }));
      } catch (error) {
        // If entry doesn't exist or fails to fetch, cache null to avoid repeated attempts
        console.log('No entry found for root:', rootId);
        setRootEntries(prev => ({
          ...prev,
          [rootId]: null
        }));
      }
    }
  }
};

// Enhanced setContextMenu function that prefetches entry data
const setContextMenuWithPrefetch = async (contextMenuData) => {
  setContextMenu(contextMenuData);
  if (contextMenuData?.node) {
    await prefetchCorpusItemEntry(contextMenuData.node);
    await prefetchRootEntry(contextMenuData.node);
  }
};

// Context menu action handlers
const handleContextMenuAction = async (action, node) => {
  try {
    switch (action) {
      case 'expand':
        // Reuse existing expand logic based on node type using current context filter settings
        if (node.type === 'root') {
          await handleRootNodeClick(node, L1, L2, contextFilterRoot, null, { x: 0, y: 0 });
        } else if (node.type === 'form') {
          await handleFormNodeClick(node, L1, L2, contextFilterForm, null, { x: 0, y: 0 });
        }
        break;
      
      case 'expand-to-corpusitems':
        // Expand word to corpus items
        if (node.type === 'word') {
          await handleWordToCorpusItemExpansion(node, L1, L2, contextFilterForm, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
        }
        break;
      
      case 'expand-to-root':
        // Expand word to root node using the consolidated expand route
        if (node.type === 'word') {
          const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
          const options = { L1, L2, limit };
          
          // Add corpus filter if contextFilter is set to a corpus ID (not 'lexicon')
          if (contextFilterForm && contextFilterForm !== 'lexicon') {
            options.corpus_id = contextFilterForm;
          }

          try {
            const result = await expandGraph('word', wordId, 'root', options);
            
            if (result && result.nodes && result.links) {
              const { nodes: rawNodes, links: newLinks } = result;
              
              if (rawNodes.length > 0) {
                // Normalize nodes to ensure consistent structure
                const newNodes = normalizeNodes(rawNodes);

                // Filter out duplicate nodes based on node ID
                const currentNodeIds = new Set(graphData.nodes.map(n => n.id));
                const filteredNewNodes = newNodes.filter(node => !currentNodeIds.has(node.id));
                
                // Filter out duplicate links
                const currentLinkIds = new Set(graphData.links.map(link => `${link.source}-${link.target}-${link.type || ''}`));
                const filteredNewLinks = newLinks.filter(link => !currentLinkIds.has(`${link.source}-${link.target}-${link.type || ''}`));

                setGraphData(prev => ({
                  nodes: [...prev.nodes, ...filteredNewNodes],
                  links: [...prev.links, ...filteredNewLinks],
                }));
              }
            }
          } catch (error) {
            console.error('Word to root expansion failed:', error);
          }
        }
        break;
      
      case 'expand-to-form':
        // Expand word to form node using the consolidated expand route
        if (node.type === 'word') {
          const wordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
          const options = { L1, L2, limit };
          
          // Add corpus filter if contextFilter is set to a corpus ID (not 'lexicon')
          if (contextFilterForm && contextFilterForm !== 'lexicon') {
            options.corpus_id = contextFilterForm;
          }

          try {
            const result = await expandGraph('word', wordId, 'form', options);
            
            if (result && result.nodes && result.links) {
              const { nodes: rawNodes, links: newLinks } = result;
              
              if (rawNodes.length > 0) {
                // Normalize nodes to ensure consistent structure
                const newNodes = normalizeNodes(rawNodes);

                // Filter out duplicate nodes based on node ID
                const currentNodeIds = new Set(graphData.nodes.map(n => n.id));
                const filteredNewNodes = newNodes.filter(node => !currentNodeIds.has(node.id));
                
                // Filter out duplicate links
                const currentLinkIds = new Set(graphData.links.map(link => `${link.source}-${link.target}-${link.type || ''}`));
                const filteredNewLinks = newLinks.filter(link => !currentLinkIds.has(`${link.source}-${link.target}-${link.type || ''}`));

                setGraphData(prev => ({
                  nodes: [...prev.nodes, ...filteredNewNodes],
                  links: [...prev.links, ...filteredNewLinks],
                }));
              }
            }
          } catch (error) {
            console.error('Word to form expansion failed:', error);
          }
        }
        break;
      
      case 'collapse':
        // Remove child nodes connected to this node
        const nodeIdsToRemove = new Set();
        
        // Find all nodes connected to the clicked node
        graphData.links.forEach(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          
          if (sourceId === node.id) {
            nodeIdsToRemove.add(targetId);
          }
        });
        
        // Remove the identified nodes and their links
        setGraphData(prev => ({
          nodes: prev.nodes.filter(n => !nodeIdsToRemove.has(n.id)),
          links: prev.links.filter(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return !nodeIdsToRemove.has(sourceId) && !nodeIdsToRemove.has(targetId);
          })
        }));
        break;
      
      case 'summarize':
        const nodeId = node.word_id || node.root_id || node.form_id || node.item_id;
        const summary = await summarizeNodeContent(nodeId, node.type);
        setInfoBubble({
          definition: summary,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        });
        break;
      
      case 'lane-entry':
        const laneWordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
        const laneEntry = await fetchLaneEntry(laneWordId);
        setInfoBubble({
          definition: laneEntry,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        });
        break;
      
      case 'hanswehr-entry':
        const hansWehrWordId = node.word_id?.low !== undefined ? node.word_id.low : node.word_id;
        const hansWehrEntry = await fetchHansWehrEntry(hansWehrWordId);
        setInfoBubble({
          definition: hansWehrEntry,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        });
        break;
      
      case 'corpus-item-entry':
        const corpusItemId = node.item_id?.low !== undefined ? node.item_id.low : node.item_id;
        const corpusId = node.corpus_id?.low !== undefined ? node.corpus_id.low : node.corpus_id;
        const entryKey = `${corpusId}_${corpusItemId}`;
        const cachedEntry = corpusItemEntries[entryKey];
        
        if (cachedEntry) {
          setInfoBubble({
            definition: cachedEntry,
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
          });
        }
        break;
      
      case 'root-entry':
        const rootId = node.root_id?.low !== undefined ? node.root_id.low : node.root_id;
        const cachedRootEntry = rootEntries[rootId];
        
        if (cachedRootEntry) {
          setInfoBubble({
            definition: cachedRootEntry,
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
          });
        }
        break;
      
      case 'report':
        const reportNodeId = node.word_id || node.root_id || node.form_id || node.item_id;
        const reportResult = await reportNodeIssue(reportNodeId, node.type, 'User reported issue via context menu');
        setInfoBubble({
          definition: reportResult,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        });
        break;
      
      default:
        console.warn('Unknown action:', action);
    }
  } catch (error) {
    console.error('Error handling context menu action:', error);
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
      handleWordToCorpusItemExpansion,
      wordClickStates,
      setWordClickStates,
      infoBubble,
      setInfoBubble,
      contextMenu,
      setContextMenu: setContextMenuWithPrefetch,
      corpusItemEntries,
      rootEntries,
      handleContextMenuAction
    }}>
      {children}
    </GraphDataContext.Provider>
  );
};

export const useGraphData = () => useContext(GraphDataContext);