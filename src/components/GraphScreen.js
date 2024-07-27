import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCorpus } from './CorpusContext';
import GraphVisualization from './GraphVisualization';
import handleRootRadicalChange from './handleRootRadicalChange';
import handleNodeClick from './handleNodeClick';
import { fetchWordsByNameId, fetchNamesOfAllah, fetchCorpora } from '../services/apiService';
import ScriptSelector from './ScriptSelector';
import RootRadicalSelector from './RootRadicalSelector';
import ContextShiftSelector from './ContextShiftSelector';

const GraphScreen = ({ selectedName, script, setScript, rootData, setRootData }) => {
  const navigate = useNavigate();
  const { selectedCorpus } = useCorpus();
  const arabicAlphabet = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');
  const [contextFilter, setContextFilter] = useState(selectedCorpus ? `corpus_${selectedCorpus}` : 'lexicon');
  const [namesOfAllah, setNamesOfAllah] = useState([]);
  const [corpora, setCorpora] = useState([]);

  const fetchNames = useCallback(async () => {
    const names = await fetchNamesOfAllah(script);
    setNamesOfAllah(names);
  }, [script]);

  const fetchCorporaData = useCallback(async () => {
    const corporaList = await fetchCorpora();
    setCorpora(corporaList);
  }, []);

  useEffect(() => {
    fetchNames();
    fetchCorporaData();
  }, [fetchNames, fetchCorporaData]);

  const fetchData = useCallback(async () => {
    if (selectedName) {
      const nameId = selectedName.name_id.low !== undefined ? selectedName.name_id.low : selectedName.name_id;
      const corpusId = contextFilter.startsWith('corpus_') ? contextFilter.split('_')[1] : null;
      const response = await fetchWordsByNameId(nameId, script, corpusId);
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
  }, [selectedName, script, setRootData, contextFilter]);

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

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <ScriptSelector script={script} handleScriptChange={handleScriptChange} />
      <ContextShiftSelector contextFilter={contextFilter} handleContextFilterChange={handleContextFilterChange} corpora={corpora} />
      <RootRadicalSelector arabicAlphabet={arabicAlphabet} r1={r1} r2={r2} r3={r3} setR1={setR1} setR2={setR2} setR3={setR3} handleRootRadicalChange={() => handleRootRadicalChange(r1, r2, r3, script, setRootData, contextFilter)} />
      <GraphVisualization data={rootData} onNodeClick={(node) => handleNodeClick(node, script, rootData, setRootData, contextFilter)} />
    </div>
  );
};

export default GraphScreen;
