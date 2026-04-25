// src/layout/InfoBubble.jsx
import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Draggable from 'react-draggable';
import Markdown from 'markdown-to-jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare, faNetworkWired } from '@fortawesome/free-solid-svg-icons';
import { fetchAnalysisByRoot, fetchArticleById } from '../../services/apiService';
import { useLabels } from '../../hooks/useLabels';
// info-bubble.css → moved to index.css

// Helper function to convert Neo4j date format
const convertNeo4jDate = (dateValue) => {
  if (!dateValue) return null;
  
  // Handle Neo4j integer format {low: number, high: number}
  if (typeof dateValue === 'object' && 'low' in dateValue) {
    // Neo4j returns epoch time in milliseconds, but may need conversion
    const timestamp = dateValue.low + (dateValue.high || 0) * Math.pow(2, 32);
    return new Date(timestamp).toLocaleDateString();
  }
  
  // Handle regular date formats
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date.toLocaleDateString();
  }
  
  return null;
};

// Lazy-loaded analysis component
const LazyAnalysisItem = ({ header, isLast }) => {
  const navigate = useNavigate();
  const t = useLabels();
  const [isExpanded, setIsExpanded] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    if (!isExpanded && !analysisData) {
      // Load analysis data on first expansion
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAnalysisByRoot(header.root.root_id);
        setAnalysisData(data.analysis.analysis);
      } catch (err) {
        setError('Failed to load analysis');
        console.error('Error loading analysis:', err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const renderAnalysis = (analysis) => (
    <div className="analysis-entry">
      {analysis.concrete_origin && (
        <div className="analysis-section">
          <h4>{t.concreteOrigin}</h4>
          <p>{analysis.concrete_origin}</p>
        </div>
      )}
      {analysis.path_to_abstraction && (
        <div className="analysis-section">
          <h4>{t.pathToAbstraction}</h4>
          <p>{analysis.path_to_abstraction}</p>
        </div>
      )}
      {analysis.fundamental_frame && (
        <div className="analysis-section">
          <h4>{t.fundamentalFrame}</h4>
          <p>{analysis.fundamental_frame}</p>
        </div>
      )}
      {analysis.basic_stats && (
        <div className="analysis-section">
          <h4>{t.basicStats}</h4>
          <p>{analysis.basic_stats}</p>
        </div>
      )}
      {analysis.quranic_refs && (
        <div className="analysis-section">
          <h4>{t.quranicRefs}</h4>
          <p>{analysis.quranic_refs}</p>
        </div>
      )}
      {analysis.hadith_refs && (
        <div className="analysis-section">
          <h4>{t.hadithRefs}</h4>
          <p>{analysis.hadith_refs}</p>
        </div>
      )}
      {analysis.poetic_refs && (
        <div className="analysis-section">
          <h4>{t.poeticRefs}</h4>
          <p>{analysis.poetic_refs}</p>
        </div>
      )}
      {analysis.proverbial_refs && (
        <div className="analysis-section">
          <h4>{t.proverbialRefs}</h4>
          <p>{analysis.proverbial_refs}</p>
        </div>
      )}
      {analysis.lexical_summary && (
        <div className="analysis-section">
          <h4>{t.lexicalSummary}</h4>
          <p>{analysis.lexical_summary}</p>
        </div>
      )}
      {analysis.semantic_path && (
        <div className="analysis-section">
          <h4>{t.semanticPath}</h4>
          <p>{analysis.semantic_path}</p>
        </div>
      )}
      {analysis.words_expressions && (
        <div className="analysis-section">
          <h4>{t.wordsExpressions}</h4>
          <p>{analysis.words_expressions}</p>
        </div>
      )}
      {analysis.poetic_references && (
        <div className="analysis-section">
          <h4>{t.poeticRefs}</h4>
          <p>{analysis.poetic_references}</p>
        </div>
      )}
      <div className="analysis-meta">
        {analysis.version && <span className="version-badge">{t.version(analysis.version)}</span>}
        {analysis.timestamp && (
          <span className="timestamp">
            {new Date(analysis.timestamp).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );

  const handleViewGraph = (e) => {
    e.stopPropagation(); // Prevent toggle when clicking View Graph
    navigate('/start', { state: { autoExpandRootId: header.root.root_id } });
  };

  return (
    <div className="compact-analysis-item">
      <div className="analysis-header cursor-pointer" onClick={handleToggle}>
        <span className="expand-indicator">{isExpanded ? '▼' : '▶'}</span>
        <span className="root-text">
          {header.root.arabic} {header.root.english && `(${header.root.english})`}
        </span>
        <span className="analysis-date">
          {convertNeo4jDate(header.analysis_meta?.timestamp) || convertNeo4jDate(header.created_at)}
        </span>
      </div>

      {isExpanded && (
        <div className="analysis-content">
          {isLoading && <div className="loading-indicator">{t.loadingAnalysis}</div>}
          {error && <div className="error-indicator">{error}</div>}
          {analysisData && (
            <>
              <div className="mb-[15px] pb-[10px] border-b border-[#e0e0e0] flex items-center gap-3">
                <span className="text-[16px] font-semibold text-ink">
                  {header.root.arabic} {header.root.english && `(${header.root.english})`}
                </span>
                <button
                  onClick={handleViewGraph}
                  className="py-2 px-4 bg-accent text-white border-none rounded cursor-pointer text-[14px] font-medium hover:bg-accent-hover transition-colors"
                >
                  {t.viewGraph}
                </button>
              </div>
              {renderAnalysis(analysisData)}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Lazy-loaded article component
const LazyArticleItem = ({ header, isLast }) => {
  const navigate = useNavigate();
  const t = useLabels();
  const [isExpanded, setIsExpanded] = useState(false);
  const [articleData, setArticleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    if (!isExpanded && !articleData) {
      // Load article data on first expansion
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchArticleById(header.article_id);
        setArticleData(data);
      } catch (err) {
        setError('Failed to load article');
        console.error('Error loading article:', err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleViewGraph = (e) => {
    e.stopPropagation(); // Prevent toggle when clicking View Graph
    if (articleData?.root?.root_id) {
      navigate('/start', { state: { autoExpandRootId: articleData.root.root_id } });
    }
  };

  const renderArticle = (article) => (
    <div>
      {article.subtitle && (
        <h4 className="m-0 mb-[10px] text-[16px] italic text-muted">
          {article.subtitle}
        </h4>
      )}
      <p className="m-0 mb-[15px] text-[12px] text-[#888]">
        by {article.signature}
      </p>
      <div className="whitespace-pre-wrap leading-[1.6] text-[14px] max-h-[400px] overflow-y-auto mb-[10px]">
        {article.text}
      </div>
      {convertNeo4jDate(article.created_at) && (
        <div className="text-[12px] text-[#888] italic">
          {convertNeo4jDate(article.created_at)}
        </div>
      )}
    </div>
  );

  return (
    <div className="compact-analysis-item">
      <div className="analysis-header cursor-pointer" onClick={handleToggle}>
        <span className="expand-indicator">{isExpanded ? '▼' : '▶'}</span>
        <span className="root-text">
          {header.title}
        </span>
        <span className="analysis-date">
          {convertNeo4jDate(header.created_at)}
        </span>
      </div>
      
      {isExpanded && (
        <div className="analysis-content">
          {isLoading && <div className="loading-indicator">{t.loadingAnalysis}</div>}
          {error && <div className="error-indicator">{error}</div>}
          {articleData && (
            <>
              {articleData.root && articleData.root.root_id && (
                <div className="mb-[15px] pb-[10px] border-b border-[#e0e0e0] grid grid-cols-3 items-center gap-3">
                  <button
                    onClick={handleViewGraph}
                    className="py-2 px-[14px] bg-accent text-white border-none rounded cursor-pointer text-[14px] font-medium flex items-center gap-2 justify-center hover:bg-accent-hover transition-colors"
                  >
                    <FontAwesomeIcon icon={faNetworkWired} />
                    {t.viewGraphShort}
                  </button>
                  <span className="text-[16px] font-semibold text-ink text-center">
                    {articleData.root.arabic} {articleData.root.english && `(${articleData.root.english})`}
                  </span>
                  <div />
                </div>
              )}
              {renderArticle(articleData.article)}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default function InfoBubble({ nodeData, filePath, title, onClose, style }) {
  const navigate = useNavigate();
  const t = useLabels();
  const infoBubbleRef = useRef(null);
  const [centeredStyle, setCenteredStyle] = useState(style);
  const [markdownContent, setMarkdownContent] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  // Load markdown content if filePath is provided
  useEffect(() => {
    if (filePath) {
      fetch(filePath)
        .then(response => response.text())
        .then(text => setMarkdownContent(text))
        .catch(error => {
          console.error('Error loading markdown:', error);
          setMarkdownContent('Error loading article content.');
        });
    }
  }, [filePath]);

  // Generate share URL based on content type
  useEffect(() => {
    if (filePath && title) {
      // For markdown files (articles/reports) - share via ArticleViewer
      const params = new URLSearchParams({
        file: filePath,
        title: title
      });
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/article?${params.toString()}`);
    } else if (nodeData && nodeData.rootId && nodeData.rootInfo) {
      // For node data (articles/analyses from main menu) - share via Explore with root ID
      // The Explore page will fetch the node data when it loads
      const params = new URLSearchParams({
        root: nodeData.rootId
      });
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/start?${params.toString()}`);
    }
  }, [filePath, title, nodeData]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoBubbleRef.current && !infoBubbleRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Calculate positioning: X centered in viewport, Y follows click with bounds clamping
  // All coordinates are viewport-relative (clientX/Y) since InfoBubble uses position: fixed
  useEffect(() => {
    if (!infoBubbleRef.current || !style) return;

    // If we're in ProfilePage mode (has transform property), use different positioning
    if (style.transform && style.transform.includes('translateX')) {
      setCenteredStyle(style);
      return;
    }

    // Get the actual bubble dimensions
    const rect = infoBubbleRef.current.getBoundingClientRect();
    const bubbleWidth = rect.width;
    const bubbleHeight = rect.height;

    // Parse the original click coordinates (viewport-relative)
    const parsePosition = (value) => {
      if (typeof value === 'string') {
        return parseFloat(value.replace('px', ''));
      }
      return value || 0;
    };

    const clickY = parsePosition(style.top);

    // X: Center horizontally in viewport
    const viewportWidth = document.documentElement.clientWidth;
    const centeredLeft = (viewportWidth - bubbleWidth) / 2;

    // Y: Center the bubble vertically on the click point
    let centeredTop = clickY - bubbleHeight / 2;

    // Bounds clamping: keep bubble within viewport (works for all devices
    // since coordinates and position:fixed are both viewport-relative)
    const viewportHeight = window.innerHeight;
    const minMargin = 10;
    const minTop = minMargin;
    const maxTop = viewportHeight - bubbleHeight - minMargin;

    if (centeredTop < minTop) {
      centeredTop = minTop;
    } else if (centeredTop > maxTop) {
      centeredTop = maxTop;
    }

    setCenteredStyle({
      ...style,
      left: `${centeredLeft}px`,
      top: `${centeredTop}px`
    });
  }, [style]);

  // The bubble UI
  const bubble = (
    <Draggable nodeRef={infoBubbleRef} cancel=".info-bubble-content, .close-button">
      <div ref={infoBubbleRef} className="info-bubble" style={centeredStyle}>
        <div className="info-bubble-header flex justify-end">
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close InfoBubble"
          >
            ×
          </button>
        </div>
        <div className="info-bubble-content">
          {(title || (nodeData && nodeData.rootInfo)) && (
            <div className="grid grid-cols-[32px_1fr_32px] items-center mb-5 gap-2">
              {/* View Graph button - only show for node data */}
              {nodeData && nodeData.rootId ? (
                <button
                  onClick={() => {
                    if (nodeData.rootId) {
                      navigate('/start', { state: { autoExpandRootId: nodeData.rootId } });
                    }
                  }}
                  className="p-[6px] bg-transparent text-accent border-none rounded cursor-pointer text-[16px] flex items-center justify-center min-w-[32px] min-h-[32px] hover:bg-[#f0f0f0] hover:text-accent-hover transition-colors"
                  title="View Graph"
                >
                  <FontAwesomeIcon icon={faNetworkWired} />
                </button>
              ) : (
                <div />
              )}
              <h2 className="m-0 text-2xl text-ink text-center">
                {title || (nodeData && nodeData.rootInfo ? `${nodeData.rootInfo.arabic} ${nodeData.rootInfo.english ? `(${nodeData.rootInfo.english})` : ''}` : '')}
              </h2>
              {/* Share button - show for all */}
              {shareUrl && (
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); }}
                  className="p-[6px] bg-transparent text-accent border-none rounded cursor-pointer text-[16px] flex items-center justify-center min-w-[32px] min-h-[32px] hover:bg-[#f0f0f0] hover:text-accent-hover transition-colors"
                  title="Copy share link to clipboard"
                >
                  <FontAwesomeIcon icon={faShare} />
                </button>
              )}
              {!shareUrl && <div />}
            </div>
          )}
          {filePath ? (
            <div className="markdown-content">
              <Markdown
                options={{
                  overrides: {
                    li: { component: ({ children }) => <li>{children}</li> },
                    ul: { component: ({ children }) => <ul className="pl-5 list-disc">{children}</ul> },
                  },
                }}
              >
                {markdownContent}
              </Markdown>
            </div>
          ) : nodeData ? (
            <>
              {(() => {
                // Count available sections to determine if only one exists
                const availableSections = [
                  nodeData.definitions,
                  nodeData.hanswehr_entry,
                  nodeData.meaning,
                  nodeData.analyses && nodeData.analyses.length > 0,
                  nodeData.entry
                ].filter(Boolean);
                
                const shouldAutoExpand = availableSections.length === 1;
                
                return (
                  <>
                    {/* Lane Dictionary Section */}
                    {nodeData.definitions && (
                      <details className="info-section" open={shouldAutoExpand}>
                        <summary>Lane</summary>
                        <div className="info-content">
                          <p>{nodeData.definitions}</p>
                        </div>
                      </details>
                    )}
                    
                    {/* Hans Wehr Dictionary Section */}
                    {nodeData.hanswehr_entry && (
                      <details className="info-section" open={shouldAutoExpand}>
                        <summary>Hans Wehr</summary>
                        <div className="info-content">
                          <p>{nodeData.hanswehr_entry}</p>
                        </div>
                      </details>
                    )}

                    {/* Proto-Semitic Gloss Section */}
                    {nodeData.meaning && (
                      <details className="info-section" open={shouldAutoExpand}>
                        <summary>Proto-Semitic Gloss</summary>
                        <div className="info-content">
                          <p>{nodeData.meaning}</p>
                        </div>
                      </details>
                    )}

                    {/* Analysis Section (for roots with LLM-generated analysis) */}
                    {nodeData.analyses && nodeData.analyses.length > 0 && (
                  <div>
                    {(() => {
                      // Sort analyses by version descending to get latest first
                      const sortedAnalyses = [...nodeData.analyses].sort((a, b) => (b.version || 0) - (a.version || 0));
                      const latestAnalysis = sortedAnalyses[0];
                      const olderAnalyses = sortedAnalyses.slice(1);

                      const handleViewGraphFromAnalysis = () => {
                        if (nodeData.rootId) {
                          navigate('/start', { state: { autoExpandRootId: nodeData.rootId } });
                        }
                      };
                      
                      const renderAnalysis = (analysis, isOlder = false) => (
                        <div className="analysis-entry">
                          {analysis.concrete_origin && (
                            <div className="analysis-section">
                              <h4>{t.concreteOrigin}</h4>
                              <p>{analysis.concrete_origin}</p>
                            </div>
                          )}
                          {analysis.path_to_abstraction && (
                            <div className="analysis-section">
                              <h4>{t.pathToAbstraction}</h4>
                              <p>{analysis.path_to_abstraction}</p>
                            </div>
                          )}
                          {analysis.fundamental_frame && (
                            <div className="analysis-section">
                              <h4>{t.fundamentalFrame}</h4>
                              <p>{analysis.fundamental_frame}</p>
                            </div>
                          )}
                          {analysis.basic_stats && (
                            <div className="analysis-section">
                              <h4>{t.basicStats}</h4>
                              <p>{analysis.basic_stats}</p>
                            </div>
                          )}
                          {analysis.quranic_refs && (
                            <div className="analysis-section">
                              <h4>{t.quranicRefs}</h4>
                              <p>{analysis.quranic_refs}</p>
                            </div>
                          )}
                          {analysis.hadith_refs && (
                            <div className="analysis-section">
                              <h4>{t.hadithRefs}</h4>
                              <p>{analysis.hadith_refs}</p>
                            </div>
                          )}
                          {analysis.poetic_refs && (
                            <div className="analysis-section">
                              <h4>{t.poeticRefs}</h4>
                              <p>{analysis.poetic_refs}</p>
                            </div>
                          )}
                          {analysis.proverbial_refs && (
                            <div className="analysis-section">
                              <h4>{t.proverbialRefs}</h4>
                              <p>{analysis.proverbial_refs}</p>
                            </div>
                          )}
                          {analysis.lexical_summary && (
                            <div className="analysis-section">
                              <h4>{t.lexicalSummary}</h4>
                              <p>{analysis.lexical_summary}</p>
                            </div>
                          )}
                          {analysis.semantic_path && (
                            <div className="analysis-section">
                              <h4>{t.semanticPath}</h4>
                              <p>{analysis.semantic_path}</p>
                            </div>
                          )}
                          {analysis.words_expressions && (
                            <div className="analysis-section">
                              <h4>{t.wordsExpressions}</h4>
                              <p>{analysis.words_expressions}</p>
                            </div>
                          )}
                          {analysis.poetic_references && (
                            <div className="analysis-section">
                              <h4>{t.poeticRefs}</h4>
                              <p>{analysis.poetic_references}</p>
                            </div>
                          )}
                          {analysis.version && (
                            <div className="analysis-meta">
                              <small>{isOlder ? t.previousVersion(analysis.version) : t.versionLabel(analysis.version)}</small>
                            </div>
                          )}
                        </div>
                      );
                      
                      return (
                        <>
                          {/* Latest analysis always visible */}
                          {renderAnalysis(latestAnalysis, false)}
                          
                          {/* Older analyses in collapsible section */}
                          {olderAnalyses.length > 0 && (
                            <details className="older-versions-section">
                              <summary>{t.previousVersions(olderAnalyses.length)}</summary>
                              <div className="older-versions-content">
                                {olderAnalyses.map((analysis, index) => (
                                  <div key={`older-${index}`}>
                                    {renderAnalysis(analysis, true)}
                                    {index < olderAnalyses.length - 1 && <hr className="version-separator" />}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </>
                      );
                    })()}
                  </div>
              )}
              
                    {/* Entry Section */}
                    {nodeData.entry && (
                      <details className="info-section" open={shouldAutoExpand}>
                        <summary>Entry</summary>
                        <div className="info-content">
                          <p>{nodeData.entry}</p>
                        </div>
                      </details>
                    )}

                    {/* Lazy-Loaded Analysis Headers */}
                    {nodeData.analysisHeaders && nodeData.analysisHeaders.length > 0 && (
                      <div>
                        {nodeData.analysisHeaders.map((header, index) => (
                          <LazyAnalysisItem 
                            key={`analysis-header-${header.root.root_id}`}
                            header={header}
                            isLast={index === nodeData.analysisHeaders.length - 1}
                          />
                        ))}
                      </div>
                    )}

                    {/* Individual Articles */}
                    {nodeData.articles && nodeData.articles.length > 0 && (
                      <div>
                        {nodeData.articles.map((article, index) => (
                          <div key={`article-${index}`} className="mb-5">
                            <h3 className="m-0 mb-[5px] text-[18px] font-bold">
                              {article.title}
                            </h3>
                            {article.subtitle && (
                              <h4 className="m-0 mb-[10px] text-[16px] italic text-muted">
                                {article.subtitle}
                              </h4>
                            )}
                            <p className="m-0 mb-[15px] text-[12px] text-[#888]">
                              by {article.signature}
                            </p>
                            <div className="whitespace-pre-wrap leading-[1.6] text-[14px] max-h-[400px] overflow-y-auto mb-[10px]">
                              {article.text}
                            </div>
                            {convertNeo4jDate(article.created_at) && (
                              <div className="text-[12px] text-[#888] italic">
                                {convertNeo4jDate(article.created_at)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Lazy-Loaded Article Headers */}
                    {nodeData.articleHeaders && nodeData.articleHeaders.length > 0 && (
                      <div>
                        {nodeData.articleHeaders.map((header, index) => (
                          <LazyArticleItem 
                            key={`article-header-${header.article_id}`}
                            header={header}
                            isLast={index === nodeData.articleHeaders.length - 1}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Show message if no data available */}
                    {!nodeData.definitions && !nodeData.hanswehr_entry && !nodeData.meaning && !nodeData.analyses && !nodeData.entry && !nodeData.analysisHeaders && !nodeData.articleHeaders && !nodeData.articles && (
                      <p>No additional information available.</p>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <p>No data available.</p>
          )}
        </div>
      </div>
    </Draggable>
  );

  // Render it under document.body, so it’s never a child of your table div
  return ReactDOM.createPortal(bubble, document.body);
}