import React from 'react';
import Draggable from 'react-draggable';

const InfoBubble = ({ definition, onClose, style }) => {
  return (
    <Draggable>
      <div className="info-bubble" style={style}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <div className="info-bubble-content">
          {definition ? (
            <p>{definition}</p>
          ) : (
            <p>No definition available.</p>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default InfoBubble;