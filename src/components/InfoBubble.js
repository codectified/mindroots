import React from 'react';

const InfoBubble = ({ definition, onClose, style }) => {
  return (
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
  );
};

export default InfoBubble;