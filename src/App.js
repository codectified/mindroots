import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import CorpusMenu from './components/CorpusMenu';
import ProjectNews from './components/ProjectNews';
import PrimaryList from './components/PrimaryList';
import GraphScreen from './components/GraphScreen';
import Settings from './components/Settings';
import About from './components/About';
import Introduction from './components/Introduction';
import ArticlesList from './components/ArticlesList';
import { ScriptProvider } from './contexts/ScriptContext';
import { ContextFilterProvider } from './contexts/ContextFilterContext';
import { CorpusProvider, useCorpus } from './contexts/CorpusContext';
import { GraphDataProvider } from './contexts/GraphDataContext';

import './App.css';



const App = () => {


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
                  <Route path="/introduction" element={<Introduction />} /> 
                  <Route path="/articles" element={<ArticlesList />} /> 


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
