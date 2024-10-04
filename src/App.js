import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainMenu from './components/navigation/MainMenu';
import Library from './components/navigation/Library';
import ProjectNews from './components/staticPages/ProjectNews';
import PrimaryList from './components/navigation/PrimaryList';
import CorpusGraphScreen from './components/graph/CorpusGraphScreen';
import Settings from './components/staticPages/Settings';
import About from './components/staticPages/About';
import Explore from './components/graph/Explore';
import Games from './components/staticPages/Games';
import ProjectMap from './components/staticPages/ProjectMap';
import Search from './components/graph/Search';

import MarkdownRenderer from './components/utils/MarkdownRenderer';
import DynamicMarkdownRenderer from './components/utils/DynamicMarkdownRenderer';
import Layout from './components/layout/Layout';

import { ScriptProvider } from './contexts/ScriptContext';
import { ContextFilterProvider } from './contexts/ContextFilterContext';
import { CorpusProvider } from './contexts/CorpusContext';
import { GraphDataProvider } from './contexts/GraphDataContext';
import { NodeLimitProvider } from './contexts/NodeLimitContext';

import './App.css';

const App = () => {
  return (
    <ScriptProvider>
      <NodeLimitProvider>
        <CorpusProvider>
          <ContextFilterProvider>
            <GraphDataProvider>
              <Router basename="/">
                <Routes>
                  <Route path="/" element={<Layout><DynamicMarkdownRenderer baseFolder="/theoption.life" /></Layout>} />
                  <Route path="/getting-started" element={<Layout><MarkdownRenderer filePath="/mindroots/getting-started.md" /></Layout>} />
                  <Route path="/project-overview" element={<Layout><MarkdownRenderer filePath="/mindroots/project-overview.md" /></Layout>} />
                  <Route path="/elements" element={<Layout><MarkdownRenderer filePath="/mindroots/elements.md" /></Layout>} />
                  <Route path="/about_" element={<Layout><MarkdownRenderer filePath="/mindroots/about.md" /></Layout>} />
                  <Route path="/mindroots" element={<Layout><MainMenu /></Layout>} />
                  <Route path="/corpus-menu" element={<Layout><Library /></Layout>} />
                  <Route path="/list" element={<Layout><PrimaryList /></Layout>} />
                  <Route path="/graph" element={<Layout><CorpusGraphScreen /></Layout>} />
                  <Route path="/settings" element={<Layout><Settings /></Layout>} />
                  <Route path="/project-news" element={<Layout><ProjectNews /></Layout>} />
                  <Route path="/about" element={<Layout><About /></Layout>} />
                  <Route path="/start" element={<Layout><Explore /></Layout>} />
                  <Route path="/games" element={<Layout><Games /></Layout>} />
                  <Route path="/project-map" element={<Layout><ProjectMap /></Layout>} />
                  <Route path="/sandbox" element={<Layout><Search /></Layout>} />
                </Routes>
              </Router>
            </GraphDataProvider>
          </ContextFilterProvider>
        </CorpusProvider>
      </NodeLimitProvider>
    </ScriptProvider>
  );
};

export default App;