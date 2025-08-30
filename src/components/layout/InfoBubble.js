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
              {/* Lane Dictionary Section */}
              {nodeData.definitions && (
                <details className="info-section">
                  <summary>Lane</summary>
                  <div className="info-content">
                    <p>{nodeData.definitions}</p>
                  </div>
                </details>
              )}
              
              {/* Hans Wehr Dictionary Section */}
              {nodeData.hanswehr_entry && (
                <details className="info-section">
                  <summary>Hans Wehr</summary>
                  <div className="info-content">
                    <p>{nodeData.hanswehr_entry}</p>
                  </div>
                </details>
              )}
              
              {/* Notes Section */}
              {nodeData.entry && (
                <details className="info-section">
                  <summary>Notes</summary>
                  <div className="info-content">
                    <p>{nodeData.entry}</p>
                  </div>
                </details>
              )}
              
              {/* Show message if no data available */}
              {!nodeData.definitions && !nodeData.hanswehr_entry && !nodeData.entry && (
                <p>No additional information available.</p>
              )}
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