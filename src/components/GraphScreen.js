import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GraphVisualization from './GraphVisualization';
import handleRootRadicalChange from './handleRootRadicalChange';
import handleFormNodeClick from './handleFormNodeClick';
import handleRootNodeClick from './handleRootNodeClick';
import { fetchWordsByCorpusItem } from '../services/apiService';
import ScriptSelector from './ScriptSelector';
import RootRadicalSelector from './RootRadicalSelector';
import ContextShiftSelector from './ContextShiftSelector';

const GraphScreen = ({ selectedName, script, setScript, rootData, setRootData, contextFilterRoot, contextFilterForm, handleContextFilterChange, selectedCorpus, corpora }) => {
  const navigate = useNavigate();
  const arabicAlphabet = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');

  useEffect(() => {
    if (selectedName && selectedName.roots && selectedName.roots.length > 0) {
      const root = selectedName.roots[0]; // Assuming the first root is the default
      setR1(root.r1 || '');
      setR2(root.r2 || '');
      setR3(root.r3 || '');
    } else {
      setR1('');
      setR2('');
      setR3('');
    }
  }, [selectedName]);

  const fetchData = useCallback(async () => {
    if (selectedName) {
      const nameId = selectedName.item_id.low !== undefined ? selectedName.item_id.low : selectedName.item_id;
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
        setRootData(newData);
      } else {
        setRootData({ nodes: [], links: [] });
      }
    }
  }, [selectedName, script, setRootData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => {
    navigate('/list');
  };

  const handleScriptChange = (event) => {
    setScript(event.target.value);
  };

  const handleNodeClick = async (node) => {
    console.log('Node clicked:', node);
    console.log('Context filters:', { contextFilterRoot, contextFilterForm });
    const corpusId = selectedCorpus ? selectedCorpus.id : null;

    if (node.type === 'form') {
      await handleFormNodeClick(node, script, rootData, setRootData, contextFilterForm, corpusId, [r1, r2, r3]);
    } else if (node.type === 'root') {
      await handleRootNodeClick(node, script, rootData, setRootData, contextFilterRoot, corpusId, [r1, r2, r3]);
    }
  };

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <ScriptSelector script={script} handleScriptChange={handleScriptChange} />
      <ContextShiftSelector 
        contextFilterRoot={contextFilterRoot}
        contextFilterForm={contextFilterForm}
        handleContextFilterChange={handleContextFilterChange}
        corpora={corpora}
      />
      <RootRadicalSelector arabicAlphabet={arabicAlphabet} r1={r1} r2={r2} r3={r3} setR1={setR1} setR2={setR2} setR3={setR3} handleRootRadicalChange={() => handleRootRadicalChange(r1, r2, r3, script, setRootData, contextFilterRoot)} />
      <GraphVisualization data={rootData} onNodeClick={handleNodeClick} />
    </div>
  );
};

export default GraphScreen;
