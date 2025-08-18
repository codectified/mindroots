import React, { useEffect, useState, useCallback } from 'react';
import GraphVisualization from './GraphVisualization';
import { expandGraph } from '../../services/apiService';
import MiniMenu from '../navigation/MiniMenu';
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
  const { selectedCorpus, selectedCorpusItem, goToNextItem, goToPreviousItem, corpusItems, loading } = useCorpus();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [availableLanguages, setAvailableLanguages] = useState(['arabic', 'english']); // Default languages



  const fetchData = useCallback(async () => {
    if (selectedCorpusItem) {
      const itemId = selectedCorpusItem.item_id.low !== undefined ? selectedCorpusItem.item_id.low : selectedCorpusItem.item_id;
      const response = await expandGraph('corpusitem', itemId, 'word', { 
        L1, 
        L2, 
        corpus_id: selectedCorpus.id 
      });
  
      if (response && response.nodes && response.nodes.length > 0) {
        // Use the response directly - it already has the correct structure
        setGraphData({ nodes: response.nodes, links: response.links });
  
        // Extract available languages from the corpus item node
        const corpusItemNode = response.nodes.find(n => n.type === 'corpusitem');
        const languages = ['arabic', 'english'];
        if (corpusItemNode?.transliteration) languages.push('transliteration');
        setAvailableLanguages(languages);
      } else {
        setGraphData({ nodes: [], links: [] });
        setAvailableLanguages(['arabic', 'english']);
      }
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
    return (
      <div>
        <MiniMenu />
        <MainMenu />
      </div>
    );
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
