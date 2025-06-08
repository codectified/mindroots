// src/layout/InfoBubble.jsx
import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';
import '../../styles/info-bubble.css'; // ensure your CSS is here

export default function InfoBubble({ definition, onClose, style }) {
  const infoBubbleRef = useRef(null);

  // The bubble UI
  const bubble = (
    <Draggable nodeRef={infoBubbleRef} cancel=".info-bubble-content, .close-button">
      <div ref={infoBubbleRef} className="info-bubble" style={style}>
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