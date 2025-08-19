import { Link } from 'react-router-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainMenu from './components/navigation/MainMenu';
import Library from './components/navigation/Library';
import ProjectNews from './components/staticPages/ProjectNews';
import PrimaryList from './components/navigation/PrimaryList';
import CorpusGraphScreen from './components/graph/CorpusGraphScreen';
import Settings from './components/staticPages/Settings';
import About from './components/staticPages/About';
import Explore from './components/graph/Explore';
import Search from './components/graph/Search';

import MarkdownRenderer from './components/utils/MarkdownRenderer';
import Layout from './components/layout/Layout';

import { LanguageProvider } from './contexts/LanguageContext';
import { ContextFilterProvider } from './contexts/ContextFilterContext';
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

import './styles/base.css';
import './styles/buttons.css';
import './styles/lists.css';
import './styles/main-menu.css';
import './styles/icon-grid.css';
import './styles/menu.css';
import './styles/language-toggle.css';
import './styles/info-bubble.css';
import './styles/node-context-menu.css';
import './styles/markdown.css';
import './styles/content.css';
import './styles/media-queries.css';
import LisanLab from './components/staticPages/LisanLab';
import Acknowledgements from './components/staticPages/Acknowledgements';

const App = () => {
  return (
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
          <ContextFilterProvider>
            <ShowLinksProvider>
              <FormFilterProvider>
                <SemiticLanguageFilterProvider>
                  <GraphDataProvider>
              <Router basename="/">
                <Routes>
                <Route path="/"
                        element={
                          <Layout>
                            <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <Link to="/mindroots">
                                <img
                                  src="/root-tree.jpeg"
                                  alt="Root Tree"
                                  style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer' }}
                                />
                              </Link>
                            </div>
                          </Layout>
                        }
                      />

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
                  <Route path="/lisan-lab/reports" element={<Layout><MarkdownRenderer filePath="/mindroots/lisanlab-reports/lisanlab-reports.md" /></Layout>}/>
                  <Route path="/acknowledgements" element={<Layout><Acknowledgements /></Layout>} />
                  

                </Routes>
              </Router>
                  </GraphDataProvider>
                </SemiticLanguageFilterProvider>
              </FormFilterProvider>
            </ShowLinksProvider>
          </ContextFilterProvider>
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

  );
};

export default App;