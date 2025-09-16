import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faSearch, 
  faMapMarked, 
  faPodcast,
  faNewspaper,
  faFlask
} from '@fortawesome/free-solid-svg-icons';
import { 
  faInstagram, 
  faLinkedin, 
  faYoutube,
  faGithub
} from '@fortawesome/free-brands-svg-icons';
import { fetchLatestAnalysis } from '../../services/apiService';
import InfoBubble from '../layout/InfoBubble';

const MainMenu = () => {
  const navigate = useNavigate();
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [infoBubbleData, setInfoBubbleData] = useState({});

  useEffect(() => {
    const loadLatestAnalysis = async () => {
      try {
        const data = await fetchLatestAnalysis();
        setLatestAnalysis(data.latest_analysis);
      } catch (error) {
        console.error('Error loading latest analysis:', error);
      }
    };

    loadLatestAnalysis();
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleShowAnalysis = () => {
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
      
      setInfoBubbleData(nodeInfoData);
      setShowInfoBubble(true);
    }
  };

  return (
    <div className="mainmenu-container">
      <div className="icon-grid">
        <div className="icon-item" onClick={() => handleNavigation('/corpus-menu')}>
          <FontAwesomeIcon icon={faBook} className="icon" />
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

      {/* Statistics Section */}
      <div className="statistics-section">
        <ul className="articles-list">
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/getting-started">Getting Started</Link>
          </li>
          <li>
            <Link to="/project-overview">Project Overview</Link>
          </li>
          <li>
            <Link to="/acknowledgements">Acknowledgements</Link>
          </li>
        </ul>
      </div>

      {/* News Section */}
      <div className="news-section">
        <h3>Latest Updates</h3>
        
        {/* Dynamic Latest Analysis */}
        {latestAnalysis && (
          <div className="latest-analysis">
            <p>
              <strong>Latest Analysis:</strong> Root{' '}
              <em>{latestAnalysis.root.arabic}</em>
              {latestAnalysis.root.english && ` (${latestAnalysis.root.english})`}
            </p>
            <button 
              className="analysis-link"
              onClick={handleShowAnalysis}
              title="View full analysis"
            >
              View Analysis
            </button>
          </div>
        )}
        
        {/* Static News Link */}
        <div className="static-news">
          <Link to="/news" className="news-link">
            Read Recent Developments →
          </Link>
        </div>
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
        />
      )}
    </div>
  );
};

export default MainMenu;