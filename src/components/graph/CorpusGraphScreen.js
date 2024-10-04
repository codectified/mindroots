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
    if (selectedCorpusItem) {
      const itemId = selectedCorpusItem.item_id.low !== undefined ? selectedCorpusItem.item_id.low : selectedCorpusItem.item_id;
      const response = await fetchWordsByCorpusItem(itemId, selectedCorpus.id, L1, L2);
  
      if (response && response.words && response.words.length > 0) {
        const nameNode = {
          id: `${response.item?.[L1]}_name`,
          label: L2 === 'off' ? response.item?.[L1] : `${response.item?.[L1]} / ${response.item?.[L2]}`,
          ...response.item,
          type: 'name',
        };
  
        const wordNodes = response.words.map(word => ({
          id: `${word?.[L1]}_word`,
          label: L2 === 'off' ? word?.[L1] : `${word?.[L1]} / ${word?.[L2]}`,
          ...word,
          type: 'word',
        }));
  
        const formNodes = response.forms.map(form => ({
          id: `${form?.[L1]}_form`,
          label: L2 === 'off' ? form?.[L1] : `${form?.[L1]} / ${form?.[L2]}`,
          ...form,
          type: 'form',
        }));
  
        const rootNodes = response.roots.map(root => ({
          id: `${root?.[L1]}_root`,
          label: L2 === 'off' ? root?.[L1] : `${root?.[L1]} / ${root?.[L2]}`,
          ...root,
          type: 'root',
        }));
  
        const nodes = [nameNode, ...wordNodes, ...formNodes, ...rootNodes];
  
        // Create links between nodes
        const links = [
          ...wordNodes.map(word => ({ source: nameNode.id, target: word.id })),
          ...formNodes.map(form => wordNodes.map(word => ({ source: word.id, target: form.id }))).flat(),
          ...rootNodes.map(root => wordNodes.map(word => ({ source: word.id, target: root.id }))).flat(),
        ];
  
        setGraphData({ nodes, links });
  
        const languages = ['arabic', 'english'];
        if (response.item?.transliteration) languages.push('transliteration');
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
