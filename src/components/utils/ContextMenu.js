// ContextMenu.js
import React from 'react';

const ContextMenu = ({ position, node, onOptionSelect }) => {
  const handleOptionClick = (option) => {
    onOptionSelect(option);
  };

  // Define options based on node type
  let options = [];
  if (node.type === 'root') {
    options = ['Fetch related words (Root)'];
  } else if (node.type === 'form') {
    options = ['Fetch related words (Form)'];
  } else if (node.type === 'word') {
    options = [
      'Fetch Root Using Word',
      'Fetch Form Using Word',
      'Fetch Word Definitions'
    ];
  }

  return (
    <div style={{
      position: 'absolute',
      top: position.y,
      left: position.x,
      background: '#fff',
      border: '1px solid #ccc',
      padding: '10px',
      zIndex: 1000
    }}>
      {options.map(option => (
        <div key={option} onClick={() => handleOptionClick(option)}>
          {option}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;