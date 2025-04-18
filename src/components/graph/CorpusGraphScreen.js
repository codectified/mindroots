import React, { useEffect, useState, useCallback } from 'react';
import GraphVisualization from './GraphVisualization';
import { fetchWordsByCorpusItem } from '../../services/apiService';
import MiniMenu from '../navigation/MiniMenu';
import { useScript } from '../../contexts/ScriptContext';
import { useContextFilter } from '../../contexts/ContextFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import InfoBubble from '../layout/InfoBubble';


const CorpusGraphScreen = () => {
  const { L1, L2 } = useScript();
  const { contextFilterRoot, contextFilterForm } = useContextFilter(); 
  const { selectedCorpus, selectedCorpusItem, goToNextItem, goToPreviousItem, corpusItems, loading } = useCorpus();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [availableLanguages, setAvailableLanguages] = useState(['arabic', 'english']); // Default languages



  const fetchData = useCallback(async () => {
    // Log at the beginning of the function to confirm it is invoked
    console.log('fetchData invoked');
  
    if (!selectedCorpusItem) {
      console.log('No selectedCorpusItem, exiting fetchData');
      return;
    }
  
    // Log the selected corpus item
    console.log('Selected Corpus Item:', selectedCorpusItem);
  
    const itemId = (selectedCorpusItem.item_id.low !== undefined)
      ? selectedCorpusItem.item_id.low
      : selectedCorpusItem.item_id;
  
    // Log the derived item ID
    console.log('Derived Item ID:', itemId);
  
    // Make the API call and log the raw backend response
    const response = await fetchWordsByCorpusItem(itemId, selectedCorpus.id, L1, L2);
    console.log('Backend Response:', response);
  
    // Check and log if the response contains nodes
    if (response && response.nodes && response.nodes.length) {
      console.log('Response contains nodes:', response.nodes);
  
      // Set graph data and log the transformed data
      setGraphData(response);
      console.log('Graph Data Set:', response);
  
      // Log available languages if transliteration is found
      if (response.nodes.some(n => n.transliteration)) {
        console.log('Transliteration detected, updating available languages');
        setAvailableLanguages(prev => [...prev, 'transliteration']);
      }
    } else {
      // Log when there is no data or an empty response
      console.log('No nodes found in response, resetting graph data and languages');
      setGraphData({ nodes: [], links: [] });
      setAvailableLanguages(['arabic', 'english']);
    }
  }, [selectedCorpusItem, selectedCorpus, L1, L2, setGraphData]);
  

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const closeInfoBubble = () => {
    setInfoBubble(null);
  };
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!selectedCorpus || !selectedCorpusItem) {
    return <div>Please select a corpus and an item to view the graph.</div>;
  }

  return (
    <div>
      <MiniMenu />
      <div className="navigation-buttons">
        <button className="menu-button" onClick={goToPreviousItem} disabled={selectedCorpusItem.index === 0}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <button className="menu-button" onClick={goToNextItem} disabled={selectedCorpusItem.index === corpusItems.length - 1}>
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
      <GraphVisualization data={graphData} onNodeClick={(node, event) => handleNodeClick(node, L1, L2, contextFilterRoot, contextFilterForm, selectedCorpus?.id, event)} />


      {/* Render info bubble if infoBubble state is set */}
      {infoBubble && (
        <InfoBubble
          definition={infoBubble.definition}
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
