import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GraphVisualization from './GraphVisualization';
import handleRootRadicalChange from './handleRootRadicalChange';
import handleNodeClick from './handleNodeClick';
import { fetchWordsByNameId } from '../services/apiService';

const GraphScreen = ({ selectedName, script, setScript, rootData, setRootData }) => {
  const navigate = useNavigate();
  const arabicAlphabet = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');
  const [contextFilter, setContextFilter] = useState('lexicon'); // Default to lexicon

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

  const handleNext = () => {
    // Logic to navigate to the next name
  };

  const handlePrevious = () => {
    // Logic to navigate to the previous name
  };

  const handleScriptChange = (event) => {
    setScript(event.target.value);
  };

  const handleContextFilterChange = (event) => {
    setContextFilter(event.target.value);
  };

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <select value={script} onChange={handleScriptChange}>
        <option value="arabic">Arabic</option>
        <option value="english">English</option>
        <option value="both">Both</option>
      </select>
      <button onClick={handlePrevious}>Previous</button>
      <button onClick={handleNext}>Next</button>
      <div>
        <label>
          Context Filter:
          <select value={contextFilter} onChange={handleContextFilterChange}>
            <option value="lexicon">Lexicon</option>
            <option value="corpus">The Most Excellent Names</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          R1:
          <select value={r1} onChange={(e) => setR1(e.target.value)}>
            <option value="">*</option>
            {arabicAlphabet.map((letter, index) => (
              <option key={index} value={letter}>{letter}</option>
            ))}
          </select>
        </label>
        <label>
          R2:
          <select value={r2} onChange={(e) => setR2(e.target.value)}>
            <option value="">*</option>
            {arabicAlphabet.map((letter, index) => (
              <option key={index} value={letter}>{letter}</option>
            ))}
          </select>
        </label>
        <label>
          R3:
          <select value={r3} onChange={(e) => setR3(e.target.value)}>
            <option value="">*</option>
            {arabicAlphabet.map((letter, index) => (
              <option key={index} value={letter}>{letter}</option>
            ))}
          </select>
        </label>
        <button onClick={() => handleRootRadicalChange(r1, r2, r3, script, setRootData, contextFilter)}>Filter</button>
      </div>
      <GraphVisualization data={rootData} onNodeClick={(node) => handleNodeClick(node, script, rootData, setRootData, contextFilter)} />
    </div>
  );
};

export default GraphScreen;
