import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import CorpusMenu from './components/CorpusMenu';
import ProjectNews from './components/ProjectNews';
import PrimaryList from './components/PrimaryList';
import GraphScreen from './components/GraphScreen';
import Settings from './components/Settings';
import About from './components/About';
import Start from './components/Start';
import ArticlesList from './components/ArticlesList';
import { ScriptProvider } from './contexts/ScriptContext';
import { ContextFilterProvider } from './contexts/ContextFilterContext';
import { CorpusProvider } from './contexts/CorpusContext';
import { GraphDataProvider } from './contexts/GraphDataContext';
import Games from './components/Games';
import MarkdownRenderer from './components/MarkdownRenderer';
import Layout from './components/Layout'; 
import ProjectMap from './components/ProjectMap'; 
import SiteMap from './components/SiteMap'; 
import Sandbox from './components/Sandbox';

import './App.css';

const App = () => {
  return (
    <Router basename="/">
      <ScriptProvider>
        <CorpusProvider>
          <ContextFilterProvider>
            <GraphDataProvider>
              <Routes>
                <Route path="/" element={<Layout><MarkdownRenderer filePath="/theoption.life/home.md" /></Layout>} />
                <Route path="/getting-started" element={<Layout><MarkdownRenderer filePath="/mindroots/getting-started.md" /></Layout>} />
                <Route path="/project-overview" element={<Layout><MarkdownRenderer filePath="/mindroots/project-overview.md" /></Layout>} />
                <Route path="/elements" element={<Layout><MarkdownRenderer filePath="/mindroots/elements.md" /></Layout>} />
                <Route path="/mindroots" element={<Layout><MainMenu /></Layout>} />
                <Route path="/corpus-menu" element={<Layout><CorpusMenu /></Layout>} />
                <Route path="/list" element={<Layout><PrimaryList /></Layout>} />
                <Route path="/graph" element={<Layout><GraphScreen /></Layout>} />
                <Route path="/settings" element={<Layout><Settings /></Layout>} />
                <Route path="/project-news" element={<Layout><ProjectNews /></Layout>} />
                <Route path="/about" element={<Layout><About /></Layout>} />
                <Route path="/start" element={<Layout><Start /></Layout>} />
                <Route path="/articles" element={<Layout><ArticlesList /></Layout>} />
                <Route path="/games" element={<Layout><Games /></Layout>} />
                <Route path="/project-map" element={<Layout><ProjectMap /></Layout>} />
                <Route path="/sandbox" element={<Layout><Sandbox /></Layout>} />
                <Route path="/site-map" element={<Layout><SiteMap /></Layout>} />
              </Routes>
            </GraphDataProvider>
          </ContextFilterProvider>
        </CorpusProvider>
      </ScriptProvider>
    </Router>
  );
};

export default App;