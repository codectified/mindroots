import React from 'react';
import { useHighlight } from '../../contexts/HighlightContext';

const HighlightController = () => {
  const { highlightGender, setHighlightGender } = useHighlight();

  const handleToggle = (property) => {
    if (property === 'gender') {
      setHighlightGender(highlightGender ? null : 'feminine'); // Toggle highlighting for feminine gender
    }
    // Additional properties can be handled here as needed
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', padding: '10px 0' }}>
            <label>Highlight:</label> {/* Simple label with a colon */}

      <label>
        <input
          type="checkbox"
          checked={highlightGender === 'feminine'}
          onChange={() => handleToggle('gender')}
        />
        Gender (F.)
      </label>


      {/* <label>
        <input
          type="checkbox"
          onChange={() => handleToggle('property1')}
        />
        Property 1
      </label>

      <label>
        <input
          type="checkbox"
          onChange={() => handleToggle('property2')}
        />
        Property 2
      </label> */}

      
    </div>
  );
};

export default HighlightController;