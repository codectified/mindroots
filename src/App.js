/*
 * MindRoots - Arabic Morphology Visualization Tool
 * Copyright (c) 2024 MindRoots Project
 * 
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
 * To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/4.0/
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProfilePage from './components/staticPages/ProfilePage';
import MainMenu from './components/navigation/MainMenu';
import Library from './components/navigation/Library';
import ProjectNews from './components/staticPages/ProjectNews';
import PrimaryList from './components/navigation/PrimaryList';
import CorpusGraphScreen from './components/graph/CorpusGraphScreen';
import Settings from './components/staticPages/Settings';
import About from './components/staticPages/About';
import Explore from './components/graph/Explore';
import Search from './components/graph/Search';
import ArticleViewer from './components/staticPages/ArticleViewer';

import MarkdownRenderer from './components/utils/MarkdownRenderer';
import Layout from './components/layout/Layout';

import { LanguageProvider } from './contexts/LanguageContext';
import { CorpusFilterProvider } from './contexts/CorpusFilterContext';
import { CorpusProvider } from './contexts/CorpusContext';
import { FilterProvider } from './contexts/FilterContext';
import { GraphDataProvider } from './contexts/GraphDataContext';
import { NodeLimitProvider } from './contexts/NodeLimitContext';
import { TextLayoutProvider } from './contexts/TextLayoutContext';
import { HighlightProvider } from './contexts/HighlightContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { WordShadeProvider } from './contexts/WordShadeContext';
import { DisplayModeProvider } from './contexts/DisplayModeContext';
import { AdvancedModeProvider } from './contexts/AdvancedModeContext';
import { ShowLinksProvider } from './components/selectors/ShowLinksToggle';
import { FormFilterProvider } from './contexts/FormFilterContext';
import { SemiticLanguageFilterProvider } from './contexts/SemiticLanguageFilterContext';
import { CorpusStatisticsProvider } from './contexts/CorpusStatisticsContext';

// typography.css → merged into index.css
// base.css → global resets moved to index.css
// buttons.css → global button reset to index.css; active classes to Tailwind inline
import './styles/lists.css';
// main-menu.css  → converted to Tailwind (MainMenu.js)
// icon-grid.css  → converted to Tailwind (MainMenu.js)
// bottom-nav.css → converted to Tailwind (BottomNav.js); body padding moved to index.css
// language-toggle.css → no active usages, removed
// menu.css → converted to Tailwind (MiniMenu.js, CorpusGraphScreen.js)
import './styles/info-bubble.css';
// node-context-menu.css → converted to Tailwind (NodeContextMenu.js)
// markdown.css → moved to index.css (ReactMarkdown descendant selectors)
// content.css → simple classes to Tailwind inline; about-page moved to index.css
// settings.css → settings-section/font-scale-buttons to Tailwind inline; range input to index.css
// media-queries.css → rules merged into component CSS files; overlay → Layout.js Tailwind
import LisanLab from './components/staticPages/LisanLab';
import LisanLabReports from './components/staticPages/LisanLabReports';
import Acknowledgements from './components/staticPages/Acknowledgements';

const App = () => {
  useEffect(() => {
    const latinScale   = parseFloat(localStorage.getItem('fontScaleLatín'))   || 1.15;
    const semiticScale = parseFloat(localStorage.getItem('fontScaleSemitic'))  || 1.3;
    document.documentElement.style.setProperty('--font-scale-latin',   latinScale);
    document.documentElement.style.setProperty('--font-scale-semitic', semiticScale);
  }, []);

  return (
    <CorpusStatisticsProvider>
    <AdvancedModeProvider>
    <DisplayModeProvider>
    <SettingsProvider>
    <TextLayoutProvider>
    <HighlightProvider>
    <LanguageProvider>
    <WordShadeProvider>

    <FilterProvider>
      <NodeLimitProvider>
        <CorpusProvider>
          <CorpusFilterProvider>
            <ShowLinksProvider>
              <FormFilterProvider>
                <SemiticLanguageFilterProvider>
                  <GraphDataProvider>
              <Router basename="/">
                <Routes>
                <Route path="/" element={<ProfilePage />} />
                  <Route path="/projects" element={<Layout><MainMenu /></Layout>} />

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
                  <Route path="/sandbox" element={<Layout><Search /></Layout>} />
                  <Route path="/lisan-lab" element={<Layout><LisanLab /></Layout>} />
                  <Route path="/lisan-lab/reports" element={<Layout><LisanLabReports /></Layout>}/>
                  <Route path="/article" element={<Layout><ArticleViewer /></Layout>}/>
                  <Route path="/acknowledgements" element={<Layout><Acknowledgements /></Layout>} />
                  <Route path="/news" element={<Layout><MarkdownRenderer filePath="/mindroots/news.md" /></Layout>} />
                  

                </Routes>
              </Router>
                  </GraphDataProvider>
                </SemiticLanguageFilterProvider>
              </FormFilterProvider>
            </ShowLinksProvider>
          </CorpusFilterProvider>
        </CorpusProvider>
      </NodeLimitProvider>
      </FilterProvider>
      </WordShadeProvider>

    </LanguageProvider>
    </HighlightProvider>
    </TextLayoutProvider>
    </SettingsProvider>
    </DisplayModeProvider>
    </AdvancedModeProvider>
    </CorpusStatisticsProvider>

  );
};

export default App;