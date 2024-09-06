import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
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
import { CorpusProvider } from './contexts/CorpusContext';
import { GraphDataProvider } from './contexts/GraphDataContext';
import Games from './components/Games';
import MarkdownRenderer from './components/MarkdownRenderer';
import Layout from './components/Layout'; // New component for layout




import './App.css';



const App = () => {


  return (
    <ScriptProvider>
      <CorpusProvider> {/* This should wrap ContextFilterProvider */}
        <ContextFilterProvider>
          <GraphDataProvider>
            <Router basename="/">
                <Routes>
                <Route path="/" element={<Layout><MarkdownRenderer filePath="/theoption.life/home.md" /></Layout>} />
                <Route path="/mindroots" element={<Layout><MainMenu /></Layout>} />
                <Route path="/corpus-menu" element={<Layout><CorpusMenu /></Layout>} />
                <Route path="/list" element={<Layout><PrimaryList /></Layout>} />
                <Route path="/graph" element={<Layout><GraphScreen /></Layout>} />
                <Route path="/settings" element={<Layout><Settings /></Layout>} />
                <Route path="/project-news" element={<Layout><ProjectNews /></Layout>} />
                <Route path="/about" element={<Layout><About /></Layout>} />
                <Route path="/introduction" element={<Layout><Introduction /></Layout>} />
                <Route path="/articles" element={<Layout><ArticlesList /></Layout>} />
                <Route path="/games" element={<Layout><Games /></Layout>} />
              </Routes>

            </Router>
          </GraphDataProvider>
        </ContextFilterProvider>
      </CorpusProvider>
    </ScriptProvider>
  );
  
  
};


export default App;
