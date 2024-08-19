import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GraphVisualization from './GraphVisualization';
import handleRootRadicalChange from './handleRootRadicalChange';
import handleFormNodeClick from './handleFormNodeClick';
import handleWordNodeClick from './handleWordNodeClick';
import handleRootNodeClick from './handleRootNodeClick';
import { fetchWordsByCorpusItem } from '../services/apiService';
import ScriptSelector from './ScriptSelector';
import RootRadicalSelector from './RootRadicalSelector';
import ContextShiftSelector from './ContextShiftSelector';
import Menu from './Menu';

import { useScript } from '../contexts/ScriptContext';
import { useContextFilter } from '../contexts/ContextFilterContext';
import { useCorpus } from '../contexts/CorpusContext';

const GraphScreen = () => {
  const { script, setScript } = useScript();
  const { contextFilterRoot, contextFilterForm, setContextFilterRoot, setContextFilterForm } = useContextFilter();
  const { selectedCorpus, corpora } = useCorpus();
  
  const navigate = useNavigate();
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    if (selectedCorpusItem && selectedCorpusItem.roots && selectedCorpusItem.roots.length > 0) {
      const root = selectedCorpusItem.roots[0]; // Assuming the first root is the default
      setR1(root.r1 || '');
      setR2(root.r2 || '');
      setR3(root.r3 || '');
    } else {
      setR1('');
      setR2('');
      setR3('');
    }
  }, [selectedCorpusItem]);

  const fetchData = useCallback(async () => {
    if (selectedCorpusItem) {
      const nameId = selectedCorpusItem.item_id.low !== undefined ? selectedCorpusItem.item_id.low : selectedCorpusItem.item_id;
      const response = await fetchWordsByCorpusItem(nameId, script);
      if (response && response.words && response.words.length > 0) {
        const nameNode = {
          id: `${response.item?.[script]}_name`,
          label: script === 'both' ? `${response.item?.arabic} / ${response.item?.english}` : response.item?.[script],
          ...response.item,
          type: 'name',
        };

        const wordNodes = response.words.map(word => ({
          id: `${word?.[script]}_word`,
          label: script === 'both' ? `${word?.arabic} / ${word?.english}` : word?.[script],
          ...word,
          type: 'word',
        }));

        const formNodes = response.forms.map(form => ({
          id: `${form?.[script]}_form`,
          label: script === 'both' ? `${form?.arabic} / ${form?.english}` : form?.[script],
          ...form,
          type: 'form',
        }));

        const rootNodes = response.roots.map(root => ({
          id: `${root?.[script]}_root`,
          label: script === 'both' ? `${root?.arabic} / ${root?.english}` : root?.[script],
          ...root,
          type: 'root',
        }));

        const nodes = [nameNode, ...wordNodes, ...formNodes, ...rootNodes];
        const links = [
          ...response.words.map(word => ({ source: nameNode.id, target: `${word?.[script]}_word` })),
          ...response.forms.map(form => ({ source: wordNodes[0]?.id, target: `${form?.[script]}_form` })), // Assuming each word has one form for simplicity
          ...response.roots.map(root => ({ source: wordNodes[0]?.id, target: `${root?.[script]}_root` })),  // Assuming each word has one root for simplicity
        ];

        const newData = { nodes, links };
        setgraphData(newData);
      } else {
        setgraphData({ nodes: [], links: [] });
      }
    }
  }, [selectedCorpusItem, script, setgraphData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => {
    navigate(`/list?corpus_id=${selectedCorpus.id}&corpus_name=${encodeURIComponent(selectedCorpus.name)}&script=${script}`);
  };
  

  const handleScriptChange = (event) => {
    setScript(event.target.value);
  };

  const handleNodeClick = async (node) => {
    console.log('Node clicked:', node);
    console.log('Context filters:', { contextFilterRoot, contextFilterForm });
    const corpusId = selectedCorpus ? selectedCorpus.id : null;
  
    if (node.type === 'form') {
      await handleFormNodeClick(node, script, graphData, setgraphData, contextFilterForm, corpusId);
    } else if (node.type === 'root') {
      await handleRootNodeClick(node, script, graphData, setgraphData, contextFilterRoot, corpusId);
    } else if (node.type === 'word') {
      await handleWordNodeClick(node, script, graphData, setgraphData, corpusId);
    }
  };
  
  

  return (
    <div>
                  <Menu /> {/* Add this line */}
      <button onClick={handleBack}>Back</button>
      <ScriptSelector script={script} handleScriptChange={handleScriptChange} />
      <ContextShiftSelector 
        contextFilterRoot={contextFilterRoot}
        contextFilterForm={contextFilterForm}
        handleContextFilterChange={handleContextFilterChange}
        corpora={corpora}
      />
      <RootRadicalSelector arabicAlphabet={arabicAlphabet} r1={r1} r2={r2} r3={r3} setR1={setR1} setR2={setR2} setR3={setR3} handleRootRadicalChange={() => handleRootRadicalChange(r1, r2, r3, script, setgraphData, contextFilterRoot)} />
      <GraphVisualization data={graphData} onNodeClick={handleNodeClick} />
    </div>
  );
};

export default GraphScreen;
