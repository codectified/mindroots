import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faMapMarked, 
  faPodcast,
  faNewspaper,
  faFlask
} from '@fortawesome/free-solid-svg-icons';
import { RiBookShelfLine } from 'react-icons/ri';
import { 
  faInstagram, 
  faLinkedin, 
  faYoutube,
  faGithub
} from '@fortawesome/free-brands-svg-icons';
import { fetchLatestAnalysis, fetchAnalysisHeaders, fetchLatestArticle, fetchArticleHeaders } from '../../services/apiService';
import InfoBubble from '../layout/InfoBubble';

const MainMenu = () => {
  const navigate = useNavigate();
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [latestArticle, setLatestArticle] = useState(null);
  const [allAnalyses, setAllAnalyses] = useState([]);
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [infoBubbleData, setInfoBubbleData] = useState({});
  const [bubblePosition, setBubblePosition] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    const loadLatestData = async () => {
      try {
        // Load latest analysis
        const analysisData = await fetchLatestAnalysis();
        setLatestAnalysis(analysisData.latest_analysis);
        
        // Load latest article
        const articleData = await fetchLatestArticle();
        setLatestArticle(articleData.latest_article);
      } catch (error) {
        console.error('Error loading latest data:', error);
      }
    };

    loadLatestData();
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleShowAnalysis = (event) => {
    if (latestAnalysis) {
      const nodeInfoData = {
        analyses: [latestAnalysis.analysis]
      };
      if (latestAnalysis.root.meaning) {
        nodeInfoData.meaning = latestAnalysis.root.meaning;
      }
      if (latestAnalysis.root.definitions) {
        nodeInfoData.definitions = latestAnalysis.root.definitions;
      }
      if (latestAnalysis.root.hanswehr_entry) {
        nodeInfoData.hanswehr_entry = latestAnalysis.root.hanswehr_entry;
      }
      
      calculateAndShowBubble(event, nodeInfoData);
    }
  };

  const handleShowAllAnalyses = async (event) => {
    try {
      const data = await fetchAnalysisHeaders();
      if (data.headers && data.headers.length > 0) {
        // Structure data for collapsible lazy-loaded analyses
        const nodeInfoData = {
          analysisHeaders: data.headers // Pass lightweight headers for on-demand loading
        };
        
        calculateAndShowBubble(event, nodeInfoData);
      }
    } catch (error) {
      console.error('Error loading analysis headers:', error);
    }
  };

  const handleShowArticle = (event) => {
    if (latestArticle) {
      const nodeInfoData = {
        articles: [latestArticle],
        signature: latestArticle.signature
      };
      
      calculateAndShowBubble(event, nodeInfoData);
    }
  };

  const handleShowAllArticles = async (event) => {
    try {
      const data = await fetchArticleHeaders();
      if (data.headers && data.headers.length > 0) {
        // Structure data for collapsible lazy-loaded articles
        const nodeInfoData = {
          articleHeaders: data.headers // Pass lightweight headers for on-demand loading
        };
        
        calculateAndShowBubble(event, nodeInfoData);
      }
    } catch (error) {
      console.error('Error loading article headers:', error);
    }
  };

  const calculateAndShowBubble = (event, nodeInfoData) => {
    // Calculate position relative to click, but keep it centered horizontally
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Center horizontally, position vertically near click but ensure visibility
    const bubbleWidth = 500; // Approximate InfoBubble width
    const bubbleHeight = 400; // Approximate InfoBubble height
    
    let top = event.clientY;
    let left = (viewportWidth - bubbleWidth) / 2;
    
    // Ensure bubble doesn't go off top or bottom of screen
    if (top + bubbleHeight > viewportHeight) {
      top = viewportHeight - bubbleHeight - 20;
    }
    if (top < 20) {
      top = 20;
    }
    
    // Ensure left positioning doesn't go off edges
    if (left < 20) {
      left = 20;
    }
    if (left + bubbleWidth > viewportWidth) {
      left = viewportWidth - bubbleWidth - 20;
    }
    
    setBubblePosition({
      top: `${top}px`,
      left: `${left}px`
    });
    
    setInfoBubbleData(nodeInfoData);
    setShowInfoBubble(true);
  };

  return (
    <div className="mainmenu-container">
      <div className="icon-grid">
        <div className="icon-item" onClick={() => handleNavigation('/corpus-menu')}>
          <RiBookShelfLine className="icon" style={{ fontSize: '3em' }} />
          <span>Corpus Library</span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/start')}>
          <FontAwesomeIcon icon={faMapMarked} className="icon" />
          <span>
            Graph Exploration
          </span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/sandbox')}>
          <FontAwesomeIcon icon={faSearch} className="icon" />
          <span>
            Positional Root Search
          </span>
        </div>
        <div className="icon-item" onClick={() => handleNavigation('/lisan-lab')}>
          <FontAwesomeIcon icon={faPodcast} className="icon" />
          <span>Lisān Lab & Reports</span>
        </div>
      </div>

      {/* News Section */}
      <div className="news-section">
        <h3>Latest Updates</h3>
        
        {/* Dynamic Latest Analysis */}
        {latestAnalysis && (
          <div className="latest-analysis">
            <p>
              <strong>Latest Analysis:</strong> Root{' '}
              <span 
                onClick={(e) => handleShowAnalysis(e)}
                title="Click to view full analysis"
                style={{ 
                  cursor: 'pointer'
                }}
              >
                <em>{latestAnalysis.root.arabic}</em>
                {latestAnalysis.root.english && ` (${latestAnalysis.root.english})`}
              </span>
            </p>
            <div style={{ marginTop: '10px' }}>
              <span 
                onClick={(e) => handleShowAllAnalyses(e)}
                title="View all previous analyses"
                style={{ 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Previous Analyses
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Latest Article */}
        {latestArticle && (
          <div className="latest-analysis">
            <p>
              <strong>Latest Article:</strong>{' '}
              <span 
                onClick={(e) => handleShowArticle(e)}
                title="Click to view full article"
                style={{ 
                  cursor: 'pointer'
                }}
              >
                <em>{latestArticle.title}</em>{' '}
                <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                  by {latestArticle.signature}
                </span>
              </span>
            </p>
            <div style={{ marginTop: '10px' }}>
              <span 
                onClick={(e) => handleShowAllArticles(e)}
                title="View all previous articles"
                style={{ 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Previous Articles
              </span>
            </div>
          </div>
        )}
        
        {/* Static News Link */}
        <div className="static-news">
          <Link to="/news" className="news-link">
            Recent Developments →
          </Link>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="statistics-section">
        <ul className="articles-list">
          <li>
            <Link to="/acknowledgements">Acknowledgements</Link>
          </li>
          <li>
            <Link to="/project-overview">Project Overview</Link>
          </li>
          <li>
            <Link to="/getting-started">Getting Started</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
      </div>

      {/* Main Site and Social Links */}
      <div className="contact-info">
        <div className="social-links">
          <a href="https://www.instagram.com/omr.ib/" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="https://www.linkedin.com/in/ibomar/" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
          <a href="https://www.https://www.youtube.com/@codectified" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a href="https://github.com/codectified/mindroots" target="_blank" rel="noopener noreferrer" className="social-icon">
            <FontAwesomeIcon icon={faGithub} />
          </a>
        </div>
      </div>

      {/* InfoBubble for Latest Analysis */}
      {showInfoBubble && (
        <InfoBubble
          nodeData={infoBubbleData}
          onClose={() => setShowInfoBubble(false)}
          style={{
            top: bubblePosition.top,
            left: bubblePosition.left,
            position: 'fixed',
            zIndex: 9999
          }}
        />
      )}
    </div>
  );
};

export default MainMenu;