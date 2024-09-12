import React from 'react';
import Draggable from 'react-draggable';

const InfoBubble = ({ definition, onClose, style }) => {
  return (
    <Draggable cancel=".info-bubble-content, .close-button"> 
      {/* cancel here ensures that dragging doesn't interfere with scrolling */}
      <div className="info-bubble" style={style}>
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