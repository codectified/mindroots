// src/layout/InfoBubble.jsx
import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';
import '../../styles/info-bubble.css'; // ensure your CSS is here

export default function InfoBubble({ nodeData, onClose, style }) {
  const infoBubbleRef = useRef(null);
  const [centeredStyle, setCenteredStyle] = useState(style);

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

  // Calculate positioning: X centered in viewport, Y follows click
  useEffect(() => {
    if (!infoBubbleRef.current || !style) return;

    // Get the actual bubble dimensions
    const rect = infoBubbleRef.current.getBoundingClientRect();
    const bubbleWidth = rect.width;
    const bubbleHeight = rect.height;

    // Parse the original click coordinates
    const parsePosition = (value) => {
      if (typeof value === 'string') {
        return parseFloat(value.replace('px', ''));
      }
      return value || 0;
    };

    const originalTop = parsePosition(style.top);

    // X: Center horizontally in viewport
    const viewportWidth = document.documentElement.clientWidth;
    const centeredLeft = (viewportWidth - bubbleWidth) / 2;

    // Y: Offset by half the bubble height to center vertically on click Y coordinate
    const centeredTop = originalTop - bubbleHeight / 2;

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
        <div className="info-bubble-header">
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close InfoBubble"
          >
            ×
          </button>
        </div>
        <div className="info-bubble-content">
          {nodeData ? (
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
                      <details className="info-section" open={shouldAutoExpand}>
                        <summary>Analysis</summary>
                  <div className="info-content">
                    {(() => {
                      // Sort analyses by version descending to get latest first
                      const sortedAnalyses = [...nodeData.analyses].sort((a, b) => (b.version || 0) - (a.version || 0));
                      const latestAnalysis = sortedAnalyses[0];
                      const olderAnalyses = sortedAnalyses.slice(1);
                      
                      const renderAnalysis = (analysis, isOlder = false) => (
                        <div className="analysis-entry">
                          {/* Core Fields (v2 schema) */}
                          {analysis.concrete_origin && (
                            <div className="analysis-section">
                              <h4>Concrete Origin</h4>
                              <p>{analysis.concrete_origin}</p>
                            </div>
                          )}
                          {analysis.path_to_abstraction && (
                            <div className="analysis-section">
                              <h4>Path to Abstraction</h4>
                              <p>{analysis.path_to_abstraction}</p>
                            </div>
                          )}
                          {analysis.fundamental_frame && (
                            <div className="analysis-section">
                              <h4>Fundamental Frame</h4>
                              <p>{analysis.fundamental_frame}</p>
                            </div>
                          )}
                          {analysis.basic_stats && (
                            <div className="analysis-section">
                              <h4>Basic Stats</h4>
                              <p>{analysis.basic_stats}</p>
                            </div>
                          )}
                          
                          {/* Reference Fields (v2 schema) */}
                          {analysis.quranic_refs && (
                            <div className="analysis-section">
                              <h4>Qur'anic References</h4>
                              <p>{analysis.quranic_refs}</p>
                            </div>
                          )}
                          {analysis.hadith_refs && (
                            <div className="analysis-section">
                              <h4>Hadith References</h4>
                              <p>{analysis.hadith_refs}</p>
                            </div>
                          )}
                          {analysis.poetic_refs && (
                            <div className="analysis-section">
                              <h4>Poetic References</h4>
                              <p>{analysis.poetic_refs}</p>
                            </div>
                          )}
                          {analysis.proverbial_refs && (
                            <div className="analysis-section">
                              <h4>Proverbial References</h4>
                              <p>{analysis.proverbial_refs}</p>
                            </div>
                          )}
                          
                          {/* Legacy v1 fields (backward compatibility) */}
                          {analysis.lexical_summary && (
                            <div className="analysis-section">
                              <h4>Lexical Summary</h4>
                              <p>{analysis.lexical_summary}</p>
                            </div>
                          )}
                          {analysis.semantic_path && (
                            <div className="analysis-section">
                              <h4>Semantic Path</h4>
                              <p>{analysis.semantic_path}</p>
                            </div>
                          )}
                          {analysis.words_expressions && (
                            <div className="analysis-section">
                              <h4>Words & Expressions</h4>
                              <p>{analysis.words_expressions}</p>
                            </div>
                          )}
                          {analysis.poetic_references && (
                            <div className="analysis-section">
                              <h4>Poetic References (Legacy)</h4>
                              <p>{analysis.poetic_references}</p>
                            </div>
                          )}
                          
                          {analysis.version && (
                            <div className="analysis-meta">
                              <small>{isOlder ? `Previous Version: ${analysis.version}` : `Version: ${analysis.version}`}</small>
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
                              <summary>Previous Versions ({olderAnalyses.length})</summary>
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
                </details>
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
                    
                    {/* Show message if no data available */}
                    {!nodeData.definitions && !nodeData.hanswehr_entry && !nodeData.meaning && !nodeData.analyses && !nodeData.entry && (
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