import React, { useRef } from 'react';
import Draggable from 'react-draggable';

const InfoBubble = ({ definition, onClose, style }) => {
  const nodeRef = useRef(null); // Ref for the draggable container

  return (
    <Draggable nodeRef={nodeRef} cancel=".close-button">
      <div ref={nodeRef} className="info-bubble" style={style}>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close InfoBubble"
        >
          ×
        </button>
        <div className="info-bubble-content">
          {definition ? <p>{definition}</p> : <p>No definition available.</p>}
        </div>
      </div>
    </Draggable>
  );
};

export default InfoBubble;