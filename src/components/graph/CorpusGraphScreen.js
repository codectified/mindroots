import React, { useEffect, useCallback, useState } from 'react';
import GraphVisualization from './GraphVisualization';
import { expandGraph, navigateToAdjacentNode } from '../../services/apiService';
import MainMenu from '../navigation/MainMenu';
import { useLanguage } from '../../contexts/LanguageContext';
import { useContextFilter } from '../../contexts/ContextFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import InfoBubble from '../layout/InfoBubble';


const CorpusGraphScreen = () => {
  const { L1, L2 } = useLanguage();
  const { contextFilterRoot, contextFilterForm } = useContextFilter(); 
  const { selectedCorpus, selectedCorpusItem, handleSelectCorpusItem, loading } = useCorpus();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [navigationLoading, setNavigationLoading] = useState(false);



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

  // Simple navigation: get next/previous corpus item and regenerate graph
  const handleNavigation = async (direction) => {
    if (!selectedCorpusItem || navigationLoading) return;

    setNavigationLoading(true);
    
    try {
      // Extract current item ID and corpus ID
      let currentItemId = selectedCorpusItem.item_id;
      let corpusId = selectedCorpus?.id || selectedCorpusItem.corpus_id;
      
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

      // Get the next/previous corpus item using the navigation API
      const navigationResult = await navigateToAdjacentNode('corpusitem', currentItemId, direction, corpusId);
      
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
          
          // Update the selected corpus item to reflect the new item
          const newCorpusItem = {
            item_id: newItemId,
            corpus_id: corpusId,
            ...navigationResult.nodeData.properties
          };
          handleSelectCorpusItem(newCorpusItem);
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
      <div className="navigation-buttons">
        <button 
          className="menu-button" 
          onClick={() => handleNavigation('previous')} 
          disabled={navigationLoading}
          style={{ opacity: navigationLoading ? 0.6 : 1 }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button 
          className="menu-button" 
          onClick={() => handleNavigation('next')} 
          disabled={navigationLoading}
          style={{ opacity: navigationLoading ? 0.6 : 1 }}
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
      <GraphVisualization data={graphData} onNodeClick={(node, event) => handleNodeClick(node, L1, L2, contextFilterRoot, contextFilterForm, selectedCorpus?.id, event)} />


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
    </div>
  );
};

export default CorpusGraphScreen;
