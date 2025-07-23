// src/layout/InfoBubble.jsx
import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';
import '../../styles/info-bubble.css'; // ensure your CSS is here

export default function InfoBubble({ definition, onClose, style }) {
  const infoBubbleRef = useRef(null);
  const [centeredStyle, setCenteredStyle] = useState(style);

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
          {definition ? <p>{definition}</p> : <p>No definition available.</p>}
        </div>
      </div>
    </Draggable>
  );

  // Render it under document.body, so it’s never a child of your table div
  return ReactDOM.createPortal(bubble, document.body);
}