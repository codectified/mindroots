import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faMapMarked,
  faPodcast,
  faBookOpen,
} from '@fortawesome/free-solid-svg-icons';
import {
  faInstagram,
  faLinkedin,
  faYoutube,
  faGithub,
} from '@fortawesome/free-brands-svg-icons';
import { fetchLatestAnalysis, fetchAnalysisHeaders, fetchLatestArticle, fetchArticleHeaders } from '../../services/apiService';
import InfoBubble from '../layout/InfoBubble';
import { useLabels } from '../../hooks/useLabels';

const MainMenu = () => {
  const navigate = useNavigate();
  const t = useLabels();
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [latestArticle, setLatestArticle] = useState(null);
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [infoBubbleData, setInfoBubbleData] = useState({});
  const [bubblePosition, setBubblePosition] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    const loadLatestData = async () => {
      try {
        const analysisData = await fetchLatestAnalysis();
        setLatestAnalysis(analysisData.latest_analysis);
        const articleData = await fetchLatestArticle();
        setLatestArticle(articleData.latest_article);
      } catch (error) {
        console.error('Error loading latest data:', error);
      }
    };
    loadLatestData();
  }, []);

  const handleNavigation = (path) => navigate(path);

  const handleShowAnalysis = (event) => {
    if (latestAnalysis) {
      const nodeInfoData = {
        analyses: [latestAnalysis.analysis],
        rootId: latestAnalysis.root.root_id,
        rootInfo: { arabic: latestAnalysis.root.arabic, english: latestAnalysis.root.english },
        ...(latestAnalysis.root.meaning       && { meaning: latestAnalysis.root.meaning }),
        ...(latestAnalysis.root.definitions   && { definitions: latestAnalysis.root.definitions }),
        ...(latestAnalysis.root.hanswehr_entry && { hanswehr_entry: latestAnalysis.root.hanswehr_entry }),
      };
      calculateAndShowBubble(event, nodeInfoData);
    }
  };

  const handleShowAllAnalyses = async (event) => {
    try {
      const data = await fetchAnalysisHeaders();
      if (data.headers?.length > 0) {
        calculateAndShowBubble(event, { analysisHeaders: data.headers });
      }
    } catch (error) {
      console.error('Error loading analysis headers:', error);
    }
  };

  const handleShowArticle = (event) => {
    if (latestArticle?.article) {
      const nodeInfoData = {
        articles: [latestArticle.article],
        signature: latestArticle.article.signature,
        ...(latestArticle.root?.root_id && {
          rootId: latestArticle.root.root_id,
          rootInfo: { arabic: latestArticle.root.arabic, english: latestArticle.root.english },
        }),
      };
      calculateAndShowBubble(event, nodeInfoData);
    }
  };

  const handleShowAllArticles = async (event) => {
    try {
      const data = await fetchArticleHeaders();
      if (data.headers?.length > 0) {
        calculateAndShowBubble(event, { articleHeaders: data.headers });
      }
    } catch (error) {
      console.error('Error loading article headers:', error);
    }
  };

  const calculateAndShowBubble = (event, nodeInfoData) => {
    const viewportWidth  = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bubbleWidth  = 500;
    const bubbleHeight = 400;
    let top  = event.clientY;
    let left = (viewportWidth - bubbleWidth) / 2;
    if (top + bubbleHeight > viewportHeight) top = viewportHeight - bubbleHeight - 20;
    if (top < 20) top = 20;
    if (left < 20) left = 20;
    if (left + bubbleWidth > viewportWidth) left = viewportWidth - bubbleWidth - 20;
    setBubblePosition({ top: `${top}px`, left: `${left}px` });
    setInfoBubbleData(nodeInfoData);
    setShowInfoBubble(true);
  };

  return (
    <div>
      {/* 2×2 icon grid */}
      <div className="grid grid-cols-2 gap-[30px] w-full max-w-[600px] mx-auto py-5">
        <div
          className="flex flex-col items-center justify-center bg-[#f9f9f9] rounded-xl text-center cursor-pointer transition-all duration-200 w-full h-[200px] min-h-[200px] p-5 hover:-translate-y-[5px] hover:bg-[#f0f0f0]"
          onClick={() => handleNavigation('/corpus-menu')}
        >
          <FontAwesomeIcon icon={faBookOpen} className="text-[40px] mb-2.5" />
          <span className="text-dynamic-sm font-serif text-ink break-words leading-[1.3] max-w-[90%]">{t.corpusLibrary}</span>
        </div>
        <div
          className="flex flex-col items-center justify-center bg-[#f9f9f9] rounded-xl text-center cursor-pointer transition-all duration-200 w-full h-[200px] min-h-[200px] p-5 hover:-translate-y-[5px] hover:bg-[#f0f0f0]"
          onClick={() => handleNavigation('/start')}
        >
          <FontAwesomeIcon icon={faMapMarked} className="text-[40px] mb-2.5" />
          <span className="text-dynamic-sm font-serif text-ink break-words leading-[1.3] max-w-[90%]">{t.graphExploration}</span>
        </div>
        <div
          className="flex flex-col items-center justify-center bg-[#f9f9f9] rounded-xl text-center cursor-pointer transition-all duration-200 w-full h-[200px] min-h-[200px] p-5 hover:-translate-y-[5px] hover:bg-[#f0f0f0]"
          onClick={() => handleNavigation('/sandbox')}
        >
          <FontAwesomeIcon icon={faSearch} className="text-[40px] mb-2.5" />
          <span className="text-dynamic-sm font-serif text-ink break-words leading-[1.3] max-w-[90%]">{t.positionalRootSearch}</span>
        </div>
        <div
          className="flex flex-col items-center justify-center bg-[#f9f9f9] rounded-xl text-center cursor-pointer transition-all duration-200 w-full h-[200px] min-h-[200px] p-5 hover:-translate-y-[5px] hover:bg-[#f0f0f0]"
          onClick={() => handleNavigation('/lisan-lab')}
        >
          <FontAwesomeIcon icon={faPodcast} className="text-[40px] mb-2.5" />
          <span className="text-dynamic-sm font-serif text-ink break-words leading-[1.3] max-w-[90%]">{t.lisanLab}</span>
        </div>
      </div>

      {/* News section */}
      <div className="my-[30px] mx-auto max-w-[600px] px-5 py-5 bg-surface rounded-lg border-l-4 border-info">
        <h3 className="m-0 mb-5 font-serif text-ink text-[20px] font-semibold">{t.latestUpdates}</h3>

        {latestAnalysis && (
          <div className="mb-4 p-4 bg-white rounded-md border border-surface-alt">
            <p className="m-0 mb-2.5 font-serif text-[#555] leading-[1.4]">
              <strong>{t.latestReport}</strong>{' '}
              <span onClick={handleShowAnalysis} className="cursor-pointer">
                <em className="arabic font-semibold text-info">{latestAnalysis.root.arabic}</em>
                {latestAnalysis.root.english && ` (${latestAnalysis.root.english})`}
              </span>
            </p>
            <div className="mt-2.5">
              <span onClick={handleShowAllAnalyses} className="cursor-pointer underline">
                {t.previousReports}
              </span>
            </div>
          </div>
        )}

        {latestArticle?.article && (
          <div className="mb-4 p-4 bg-white rounded-md border border-surface-alt">
            <p className="m-0 mb-2.5 font-serif text-[#555] leading-[1.4]">
              <strong>{t.latestArticle}</strong>{' '}
              <span onClick={handleShowArticle} className="cursor-pointer">
                <em className="font-semibold text-info">{latestArticle.article.title}</em>{' '}
                <span className="text-xs text-[#888] italic">by {latestArticle.article.signature}</span>
              </span>
            </p>
            <div className="mt-2.5">
              <span onClick={handleShowAllArticles} className="cursor-pointer underline">
                {t.previousArticles}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2.5">
          <Link
            to="/news"
            className="text-info no-underline font-serif font-medium hover:text-[#0056b3] hover:underline transition-colors duration-200"
          >
            {t.recentDevelopments}
          </Link>
        </div>
      </div>

      {/* Footer links */}
      <div className="my-5 text-center">
        <ul className="list-none p-0 text-[18px]">
          <li className="my-[5px] text-[#444] text-[20px]"><Link to="/acknowledgements" className="text-[#0056b3] no-underline hover:underline">{t.acknowledgements}</Link></li>
          <li className="my-[5px] text-[#444] text-[20px]"><Link to="/project-overview"  className="text-[#0056b3] no-underline hover:underline">{t.projectOverview}</Link></li>
          <li className="my-[5px] text-[#444] text-[20px]"><Link to="/getting-started"   className="text-[#0056b3] no-underline hover:underline">{t.gettingStarted}</Link></li>
          <li className="my-[5px] text-[#444] text-[20px]"><Link to="/about"             className="text-[#0056b3] no-underline hover:underline">{t.about}</Link></li>
        </ul>
      </div>

      {/* Social links */}
      <div className="mt-auto text-center py-2.5">
        <div className="flex justify-center gap-2.5 mt-2.5">
          <a href="https://www.instagram.com/omr.ib/" target="_blank" rel="noopener noreferrer" className="text-[1.5em] text-ink transition-colors duration-300 hover:text-[#e1306c]">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="https://www.linkedin.com/in/ibomar/" target="_blank" rel="noopener noreferrer" className="text-[1.5em] text-ink transition-colors duration-300 hover:text-[#0077b5]">
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
          <a href="https://www.youtube.com/@codectified" target="_blank" rel="noopener noreferrer" className="text-[1.5em] text-ink transition-colors duration-300 hover:text-[#ff0000]">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a href="https://github.com/codectified/mindroots" target="_blank" rel="noopener noreferrer" className="text-[1.5em] text-ink transition-colors duration-300 hover:text-ink">
            <FontAwesomeIcon icon={faGithub} />
          </a>
        </div>
      </div>

      {/* InfoBubble for analysis/article previews */}
      {showInfoBubble && (
        <InfoBubble
          nodeData={infoBubbleData}
          onClose={() => setShowInfoBubble(false)}
          className="fixed z-[9999]"
          style={{ top: bubblePosition.top, left: bubblePosition.left }}
        />
      )}
    </div>
  );
};

export default MainMenu;
