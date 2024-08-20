import React, { useEffect, useState, useCallback } from 'react';
import GraphVisualization from './GraphVisualization';
import { fetchWordsByCorpusItem } from '../services/apiService';
import Menu from './Menu';
import { useScript } from '../contexts/ScriptContext';
import { useCorpus } from '../contexts/CorpusContext';

const GraphScreen = () => {
  const { L1, setL1, L2, setL2 } = useScript();
  const { selectedCorpus, selectedCorpusItem } = useCorpus();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

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
        const links = [
          ...response.words.map(word => ({ source: nameNode.id, target: `${word?.[L1]}_word` })),
          ...response.forms.map(form => ({ source: wordNodes[0]?.id, target: `${form?.[L1]}_form` })),
          ...response.roots.map(root => ({ source: wordNodes[0]?.id, target: `${root?.[L1]}_root` })),
        ];

        setGraphData({ nodes, links });
      } else {
        setGraphData({ nodes: [], links: [] });
      }
    }
  }, [selectedCorpusItem, selectedCorpus, L1, L2]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
    // Additional node click handling logic can be added here
  };

  return (
    <div>
      <Menu />
      <div>
        <label>Primary Language (L1):</label>
        <select value={L1} onChange={(e) => setL1(e.target.value)}>
          <option value="arabic">Arabic</option>
          <option value="english">English</option>
        </select>
      </div>
      <div>
        <label>Secondary Language (L2):</label>
        <select value={L2} onChange={(e) => setL2(e.target.value)}>
          <option value="off">Off</option>
          <option value="arabic">Arabic</option>
          <option value="english">English</option>
        </select>
      </div>
      <GraphVisualization data={graphData} onNodeClick={handleNodeClick} />
    </div>
  );
};

export default GraphScreen;
