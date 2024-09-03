import React, { useEffect, useState, useCallback } from 'react';
import GraphVisualization from './GraphVisualization';
import { fetchWordsByCorpusItem } from '../services/apiService';
import Menu from './Menu';
import HandleWordNodeRightClick from './handleWordNodeRightClick';
import { useScript } from '../contexts/ScriptContext';
import { useContextFilter } from '../contexts/ContextFilterContext';
import { useCorpus } from '../contexts/CorpusContext';
import { useGraphData } from '../contexts/GraphDataContext';
import handleRootNodeClick from './handleRootNodeClick';
import handleFormNodeClick from './handleFormNodeClick';
import handleWordNodeClick from './handleWordNodeClick';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';


const GraphScreen = () => {
  const { L1, L2 } = useScript();
  const { contextFilterRoot, contextFilterForm } = useContextFilter(); 
  const { selectedCorpus, selectedCorpusItem, goToNextItem, goToPreviousItem, corpusItems, loading } = useCorpus();
  const { graphData, setGraphData } = useGraphData(); 
  const [availableLanguages, setAvailableLanguages] = useState(['arabic', 'english']); // Default languages
  const [infoBubble, setInfoBubble] = useState(null); // State to manage the info bubble visibility
  const [rightClickedNode, setRightClickedNode] = useState(null); // State to track right-clicked node



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

  const handleNodeClick = async (node) => {
    console.log('Node clicked:', node);
    console.log('Context filters:', { contextFilterRoot, contextFilterForm });
    const corpusId = selectedCorpus ? selectedCorpus.id : null;
  
    if (node.type === 'form') {
      await handleFormNodeClick(node, L1, L2, graphData, setGraphData, contextFilterForm, corpusId);
    } else if (node.type === 'root') {
      await handleRootNodeClick(node, L1, L2, graphData, setGraphData, contextFilterRoot, corpusId);
    } else if (node.type === 'word') {
      await handleWordNodeClick(node, L1, L2, graphData, setGraphData, corpusId);
    }
  };

  const handleNodeRightClick = (node, event) => {
    event.preventDefault(); // Prevent the default context menu
    console.log('Right-clicked node:', node); // Log to verify the event is triggered
    console.log('Event:', event); // Log the event to see its details
    setRightClickedNode({
      node,
      position: { x: event.clientX, y: event.clientY } // Capture and pass position
    });
  };

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
      <Menu />
      {!selectedCorpus || !selectedCorpusItem ? (
        <div>Please select a corpus and an item to view the graph.</div>
      ) : (
        <>
          <div className="navigation-buttons">
            <button className="menu-button" onClick={goToPreviousItem} disabled={selectedCorpusItem.index === 0}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <button className="menu-button" onClick={goToNextItem} disabled={selectedCorpusItem.index === corpusItems.length - 1}>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <GraphVisualization 
            data={graphData} 
            onNodeClick={handleNodeClick} 
            onNodeRightClick={handleNodeRightClick} 
          />
{rightClickedNode && (
  <>
    <HandleWordNodeRightClick
      node={rightClickedNode.node}
      L1={L1}
      L2={L2}
      position={rightClickedNode.position}
    />
    {console.log('Rendering HandleWordNodeRightClick component')}
  </>
)}
        </>
      )}
    </div>
  );
};

export default GraphScreen;
