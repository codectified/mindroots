import React, { useEffect, useCallback, useState } from 'react';
import GraphVisualization from './GraphVisualization';
import NodeInspector from './NodeInspector';
import { expandGraph, navigateToAdjacentNode, navigateByGlobalPosition } from '../../services/apiService';
import MainMenu from '../navigation/MainMenu';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCorpusFilter } from '../../contexts/CorpusFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import InfoBubble from '../layout/InfoBubble';


const CorpusGraphScreen = () => {
  const { L1, L2 } = useLanguage();
  const { corpusFilter } = useCorpusFilter();
  const { selectedCorpus, selectedCorpusItem, handleSelectCorpusItem, loading } = useCorpus();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble, nodeInspectorData, setNodeInspectorData, handleNodeNavigation } = useGraphData();
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [currentNavigationItem, setCurrentNavigationItem] = useState(null);



  const fetchData = useCallback(async () => {
    if (selectedCorpusItem) {
      try {
        const itemId = selectedCorpusItem.item_id.low !== undefined ? selectedCorpusItem.item_id.low : selectedCorpusItem.item_id;
        const corpusId = selectedCorpus?.id || selectedCorpusItem.corpus_id?.low || selectedCorpusItem.corpus_id;
        
        console.log('🔍 CorpusGraphScreen fetchData:', {
          selectedCorpusItem,
          itemId,
          corpusId,
          selectedCorpus: selectedCorpus?.id,
          L1, L2
        });
        
        // Ensure corpusId is valid before making the request
        if (!corpusId) {
          console.error('❌ CorpusGraphScreen: corpusId is undefined, cannot expand graph');
          setGraphData({ nodes: [], links: [] });
          return;
        }

        const response = await expandGraph('corpusitem', itemId, 'word', { 
          L1, 
          L2, 
          corpus_id: corpusId 
        });
  
        if (response && response.nodes && response.nodes.length > 0) {
          console.log('✅ CorpusGraphScreen: Graph data received:', response.nodes.length, 'nodes');
          setGraphData({ nodes: response.nodes, links: response.links });
          // Initialize currentNavigationItem for subsequent navigation
          setCurrentNavigationItem(selectedCorpusItem);
        } else {
          console.log('📭 CorpusGraphScreen: No graph data received');
          setGraphData({ nodes: [], links: [] });
        }
      } catch (error) {
        console.error('❌ CorpusGraphScreen fetchData error:', error);
        setGraphData({ nodes: [], links: [] });
      }
    }
  }, [selectedCorpusItem, selectedCorpus, L1, L2, setGraphData]);
  

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const closeInfoBubble = () => {
    setInfoBubble(null);
  };

  const closeNodeInspector = () => {
    setNodeInspectorData(null);
  };

  // Simple navigation: get next/previous corpus item and regenerate graph
  const handleNavigation = async (direction) => {
    // Use currentNavigationItem if available, fallback to selectedCorpusItem
    const navItem = currentNavigationItem || selectedCorpusItem;
    if (!navItem || navigationLoading) return;

    setNavigationLoading(true);
    
    try {
      // Extract current item ID and corpus ID
      let currentItemId = navItem.item_id;
      let corpusId = selectedCorpus?.id || navItem.corpus_id;
      
      // Handle wrapped property format if needed
      if (currentItemId && typeof currentItemId === 'object' && 'value' in currentItemId) {
        currentItemId = currentItemId.value;
      }
      if (currentItemId && typeof currentItemId === 'object' && 'low' in currentItemId) {
        currentItemId = currentItemId.low;
      }
      if (corpusId && typeof corpusId === 'object' && 'value' in corpusId) {
        corpusId = corpusId.value;
      }
      if (corpusId && typeof corpusId === 'object' && 'low' in corpusId) {
        corpusId = corpusId.low;
      }

      console.log('🧭 Navigation request:', { direction, currentItemId, corpusId });

      // Try to use global_position for navigation (more reliable for Quran)
      let navigationResult = null;
      const globalPosition = navItem.global_position;
      
      if (globalPosition !== undefined && globalPosition !== null) {
        // Handle wrapped property format for global_position
        let actualGlobalPosition = globalPosition;
        if (globalPosition && typeof globalPosition === 'object' && 'value' in globalPosition) {
          actualGlobalPosition = globalPosition.value;
        }
        if (globalPosition && typeof globalPosition === 'object' && 'low' in globalPosition) {
          actualGlobalPosition = globalPosition.low;
        }
        
        console.log('🧭 Using global_position navigation:', actualGlobalPosition);
        navigationResult = await navigateByGlobalPosition(corpusId, actualGlobalPosition, direction);
      } else {
        // Fallback to the old item_id based navigation
        console.log('🧭 Fallback to item_id navigation');
        navigationResult = await navigateToAdjacentNode('corpusitem', currentItemId, direction, corpusId);
      }
      
      if (navigationResult && navigationResult.nodeData) {
        // Extract the new item ID
        const newItemId = navigationResult.nodeData.nodeId;
        
        console.log('✅ Found adjacent item:', newItemId);
        
        // Generate new graph for this corpus item (same call as clicking on corpus item)
        const response = await expandGraph('corpusitem', newItemId, 'word', { 
          L1, 
          L2, 
          corpus_id: corpusId 
        });

        if (response && response.nodes && response.nodes.length > 0) {
          console.log('✅ New graph generated:', response.nodes.length, 'nodes');
          setGraphData({ nodes: response.nodes, links: response.links });
          
          // Update currentNavigationItem to the new item for next navigation
          // Create a corpus item object from the navigation result
          const newCorpusItem = {
            item_id: navigationResult.nodeData.nodeId,
            corpus_id: corpusId,
            global_position: navigationResult.nodeData.properties?.global_position,
            // Include other properties that might be needed
            ...navigationResult.nodeData.properties
          };
          setCurrentNavigationItem(newCorpusItem);
        } else {
          console.log('📭 No graph data for new corpus item');
          setGraphData({ nodes: [], links: [] });
        }
      } else {
        console.log('📭 No adjacent corpus item found');
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
    } finally {
      setNavigationLoading(false);
    }
  };
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!selectedCorpus || !selectedCorpusItem) {
    return (
      <div>
        <MainMenu />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-row gap-[10px]">
        <button
          className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-ink text-white cursor-pointer border-none text-[14px] p-[6px] hover:bg-ink-hover xs:text-[16px] xs:p-2 md:text-[20px] md:p-0 disabled:opacity-60"
          onClick={() => handleNavigation('previous')}
          disabled={navigationLoading}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button
          className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-ink text-white cursor-pointer border-none text-[14px] p-[6px] hover:bg-ink-hover xs:text-[16px] xs:p-2 md:text-[20px] md:p-0 disabled:opacity-60"
          onClick={() => handleNavigation('next')}
          disabled={navigationLoading}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
      <GraphVisualization data={graphData} onNodeClick={(node, event) => handleNodeClick(node, L1, L2, event)} />


      {/* Render info bubble if infoBubble state is set */}
      {infoBubble && (
        <InfoBubble
          nodeData={infoBubble.nodeData || { definitions: infoBubble.definition }}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
          }}
        />
      )}

      {/* Render node inspector if nodeInspectorData is set */}
      {nodeInspectorData && (
        <NodeInspector
          nodeData={nodeInspectorData}
          onClose={closeNodeInspector}
          onNavigate={handleNodeNavigation}
        />
      )}
    </div>
  );
};

export default CorpusGraphScreen;
