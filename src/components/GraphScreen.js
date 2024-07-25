import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GraphVisualization from './GraphVisualization';
import handleRootRadicalChange from './handleRootRadicalChange';
import handleNodeClick from './handleNodeClick';
import { fetchWordsByNameId, fetchNamesOfAllah } from '../services/apiService';
import ScriptSelector from './ScriptSelector';
import NameSelector from './NameSelector';
import RootRadicalSelector from './RootRadicalSelector';
import ContextFilterSelector from './ContextFilterSelector';

const GraphScreen = ({ selectedName, script, setScript, rootData, setRootData }) => {
  const navigate = useNavigate();
  const arabicAlphabet = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');
  const [contextFilter, setContextFilter] = useState('lexicon');
  const [namesOfAllah, setNamesOfAllah] = useState([]);

  const fetchNames = useCallback(async () => {
    const names = await fetchNamesOfAllah(script);
    setNamesOfAllah(names);
  }, [script]);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

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
      const nameId = selectedName.name_id.low !== undefined ? selectedName.name_id.low : selectedName.name_id;
      const response = await fetchWordsByNameId(nameId, script);
      if (response.words.length > 0) {
        const nameNode = { id: `${response.name[script]}_name`, label: script === 'both' ? `${response.name.arabic} / ${response.name.english}` : response.name[script], ...response.name, type: 'name' };
        const wordNodes = response.words.map(word => ({ id: `${word[script]}_word`, label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script], ...word, type: 'word' }));
        const formNodes = response.forms.map(form => ({ id: `${form[script]}_form`, label: script === 'both' ? `${form.arabic} / ${form.english}` : form[script], ...form, type: 'form' }));
        const rootNodes = response.roots.map(root => ({ id: `${root[script]}_root`, label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script], ...root, type: 'root' }));

        const nodes = [nameNode, ...wordNodes, ...formNodes, ...rootNodes];
        const links = [
          ...response.words.map(word => ({ source: nameNode.id, target: `${word[script]}_word` })),
          ...response.forms.map(form => ({ source: wordNodes[0]?.id, target: `${form[script]}_form` })), // Assuming each word has one form for simplicity
          ...response.roots.map(root => ({ source: wordNodes[0]?.id, target: `${root[script]}_root` }))  // Assuming each word has one root for simplicity
        ];

        const newData = { nodes, links };
        setRootData(newData);
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
    fetchNames(); // Update names list when script changes
  };

  const handleContextFilterChange = (event) => {
    setContextFilter(event.target.value);
  };

  const handleNameChange = (event) => {
    const selectedNameId = event.target.value;
    const selectedName = namesOfAllah.find(name => name.name_id === parseInt(selectedNameId));
    // Assuming the parent component manages the selectedName state, update it here
    // setSelectedName(selectedName); // Uncomment and implement this line if needed
  };

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <ScriptSelector script={script} handleScriptChange={handleScriptChange} />
      <ContextFilterSelector contextFilter={contextFilter} handleContextFilterChange={handleContextFilterChange} />
      <NameSelector namesOfAllah={namesOfAllah} script={script} handleNameChange={handleNameChange} />
      <RootRadicalSelector arabicAlphabet={arabicAlphabet} r1={r1} r2={r2} r3={r3} setR1={setR1} setR2={setR2} setR3={setR3} handleRootRadicalChange={() => handleRootRadicalChange(r1, r2, r3, script, setRootData, contextFilter)} />
      <GraphVisualization data={rootData} onNodeClick={(node) => handleNodeClick(node, script, rootData, setRootData, contextFilter)} />
    </div>
  );
};

export default GraphScreen;