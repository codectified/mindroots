import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import CorpusMenu from './components/CorpusMenu';
import ProjectNews from './components/ProjectNews';
import PrimaryList from './components/PrimaryList';
import GraphScreen from './components/GraphScreen';
import Settings from './components/Settings';
import About from './components/About';
import Menu from './components/Menu';

import { ScriptProvider } from './contexts/ScriptContext';
import { ContextFilterProvider } from './contexts/ContextFilterContext';
import { CorpusProvider, useCorpus } from './contexts/CorpusContext';
import { GraphDataProvider } from './contexts/GraphDataContext';




import './App.css';


const App = () => {
  // const [script, setScript] = useState('arabic'); // Initialize script state
  // const [graphData, setGraphData] = useState({ nodes: [], links: [] }); // Initialize root data state
  // const [selectedCorpusItem, setselectedCorpusItem] = useState(null); // Initialize selected name state
  // const [contextFilterRoot, setContextFilterRoot] = useState('lexicon'); // Initialize root context filter state
  // const [contextFilterForm, setContextFilterForm] = useState('corpus'); // Initialize form context filter state
  // const [selectedCorpus, setSelectedCorpus] = useState(null); // Initialize selected corpus state
  // const [corpora, setCorpora] = useState([]); // Initialize corpora state

  // // Handle corpus selection and set default contexts for root and form
  // const handleSelectCorpus = (corpus, corpora) => {
  //   console.log('Selected corpus:', corpus);
  //   setSelectedCorpus(corpus);
  //   setContextFilterForm(corpus.id); // Set the default form context to the selected corpus ID
  //   setselectedCorpusItem(null); // Reset selected name
  //   setCorpora(corpora); // Set the corpora state with the passed corpora
  // };

  // const handleSwitchScript = (newScript) => {
  //   setScript(newScript); // Set the script state
  // };

  // const handleContextFilterChange = (event) => {
  //   const { name, value } = event.target;
  //   console.log(`Context filter change - ${name}: ${value}`);
  //   if (name === 'root') {
  //     console.log('Updating root context:', value); // Debugging
  //     setContextFilterRoot(value);
  //   } else if (name === 'form') {
  //     console.log('Updating form context:', value); // Debugging
  //     setContextFilterForm(value);
  //   }
  // };

  return (
    <ScriptProvider>
      <CorpusProvider> {/* This should wrap ContextFilterProvider */}
        <ContextFilterProvider>
          <GraphDataProvider>
            <Router basename="/mindroots">
              <div className="overlay">
                <Routes>
                  <Route path="/" element={<MainMenu />} />
                  <Route path="/corpus-menu" element={<CorpusMenu />} />
                  <Route path="/list" element={<PrimaryList />} />
                  <Route path="/graph" element={<GraphScreen />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/project-news" element={<ProjectNews />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </div>
            </Router>
          </GraphDataProvider>
        </ContextFilterProvider>
      </CorpusProvider>
    </ScriptProvider>
  );
  
  
};


export default App;
