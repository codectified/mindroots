import React, { useRef } from 'react';
import Draggable from 'react-draggable';

const InfoBubble = ({ definition, onClose, style }) => {
  const infoBubbleRef = useRef(null); // Create a ref for the draggable node

  return (
    <Draggable nodeRef={infoBubbleRef} cancel=".info-bubble-content, .close-button">
      {/* Use nodeRef here to avoid findDOMNode usage */}
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
};

export default InfoBubble;