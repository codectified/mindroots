import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import PrimaryList from './components/PrimaryList';
import GraphScreen from './components/GraphScreen';
import './App.css';

const App = () => {
  const [script, setScript] = useState('arabic'); // Initialize script state
  const [rootData, setRootData] = useState({ nodes: [], links: [] }); // Initialize root data state
  const [selectedName, setSelectedName] = useState(null); // Initialize selected name state
  const [contextFilterRoot, setContextFilterRoot] = useState('corpus'); // Initialize root context filter state
  const [contextFilterForm, setContextFilterForm] = useState('corpus'); // Initialize form context filter state
  const [selectedCorpus, setSelectedCorpus] = useState(null); // Initialize selected corpus state
  const [corpora, setCorpora] = useState([]); // Initialize corpora state

  // Handle corpus selection and set default contexts for root and form
  const handleSelectCorpus = (corpus, corpora) => {
    console.log('Selected corpus:', corpus);
    setSelectedCorpus(corpus);
    setContextFilterRoot(corpus.id); // Set the default root context to the selected corpus ID
    setContextFilterForm(corpus.id); // Set the default form context to the selected corpus ID
    setSelectedName(null); // Reset selected name
    setCorpora(corpora); // Set the corpora state with the passed corpora
  };

  const handleSwitchScript = (newScript) => {
    setScript(newScript); // Set the script state
  };

  const handleContextFilterChange = (event) => {
    const { name, value } = event.target;
    console.log(`Context filter change - ${name}: ${value}`);
    if (name === 'root') {
      setContextFilterRoot(value); // Change the root context filter
    } else if (name === 'form') {
      setContextFilterForm(value); // Change the form context filter
    }
  };

  return (
    <Router basename="/mindroots">
      <div className="overlay">
        <Routes>
          <Route path="/" element={<MainMenu onSelectCorpus={handleSelectCorpus} />} />
          <Route path="/list" element={<PrimaryList script={script} setScript={handleSwitchScript} setRootData={setRootData} setSelectedName={setSelectedName} />} />
          <Route path="/graph" element={<GraphScreen selectedName={selectedName} script={script} setScript={handleSwitchScript} rootData={rootData} setRootData={setRootData} contextFilterRoot={contextFilterRoot} contextFilterForm={contextFilterForm} handleContextFilterChange={handleContextFilterChange} selectedCorpus={selectedCorpus} corpora={corpora} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
