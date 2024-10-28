// ../components/selectors/HighlightController.js
import React from 'react';
import { useHighlight } from '../../contexts/HighlightContext';

const HighlightController = () => {
  const { highlightGender, setHighlightGender, highlightVerb, setHighlightVerb, highlightParticle, setHighlightParticle } = useHighlight();

  const handleToggle = (property) => {
    if (property === 'gender') {
      setHighlightGender(highlightGender ? null : 'feminine'); // Toggle highlighting for feminine gender
    } else if (property === 'verb') {
      setHighlightVerb(!highlightVerb); // Toggle highlighting for verbs
    } else if (property === 'particle') {
      setHighlightParticle(!highlightParticle); // Toggle highlighting for particles
    }
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
        Feminine nouns
      </label>

      <label>
        <input
          type="checkbox"
          checked={highlightVerb}
          onChange={() => handleToggle('verb')}
        />
        Verbs
      </label>

      <label>
        <input
          type="checkbox"
          checked={highlightParticle}
          onChange={() => handleToggle('particle')}
        />
        Particles
      </label>
    </div>
  );
};

export default HighlightController;