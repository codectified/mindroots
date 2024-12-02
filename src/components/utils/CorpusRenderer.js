import React from 'react';
import { useHighlight } from '../../contexts/HighlightContext';
import { useTextLayout } from '../../contexts/TextLayoutContext';

const CorpusRenderer = ({
  corpusId,
  corpusType,
  items,
  setItems,
  surah,
  aya,
  setSurah,
  setAya,
  ayaCount,
  L1,
  L2,
  handleSelectCorpusItem,
}) => {
  const {
    highlightGender,
    highlightVerb,
    highlightParticle,
    freeformMode,
    highlightColor, // Access the selected highlight color
  } = useHighlight();
  const { layout } = useTextLayout(); // Access the text layout setting

  

  // Toggles freeform highlight state for an item
  const handleFreeformHighlight = (item) => {
    if (!freeformMode) return; // Only allow highlighting in Freeform Mode
    item.isFreeformHighlighted = !item.isFreeformHighlighted;
    // Simulate state update for re-render (items are assumed to be in parent state)
    setItems([...items]);
  };

  const handleFreeformAyaHighlight = (ayaIndex) => {
    if (!freeformMode) return;
    const updatedItems = items.map((item) =>
      item.aya_index === ayaIndex
        ? { ...item, isFreeformHighlighted: true, highlightColor }
        : item
    );
    setItems(updatedItems);
  };

  // Adjust styles based on highlight settings and Freeform Mode
  const getWordStyle = (item) => {
    if (item.isFreeformHighlighted) {
      return { backgroundColor: item.highlightColor || '#FF4500', borderRadius: '5px', padding: '2px' };
    }
    if (highlightGender && item.gender === highlightGender) {
      return { color: highlightGender === 'feminine' ? 'gold' : 'lightblue', fontWeight: 'bold' };
    }
    if (highlightVerb && item.pos === 'verb') {
      return { color: 'green', fontWeight: 'bold' };
    }
    if (highlightParticle && item.pos !== 'noun' && item.pos !== 'verb') {
      return { color: 'blue', fontStyle: 'italic' };
    }
    return {};
  };


  const renderQuran = () => {
    const basmala = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
    const surahNumber = Number(surah) || (items.length > 0 ? Number(items[0].sura_index.low) : null);
  
    // Group items by AYA index
    const groupedByAya = items.reduce((acc, item) => {
      if (!acc[item.aya_index]) acc[item.aya_index] = [];
      acc[item.aya_index].push(item);
      return acc;
    }, {});
  
    const isAyaHighlighted = (ayaIndex) => 
      groupedByAya[ayaIndex].every((item) => item.isFreeformHighlighted);
  
    const getWordStyle = (item) => {
      // Apply freeform highlight styles if in freeform mode
      if (item.isFreeformHighlighted) {
        return {
          backgroundColor: item.highlightColor || highlightColor,
          borderRadius: '5px',
          padding: '2px',
        };
      }
  
      // Apply noun, verb, or particle highlight styles
      if (highlightGender && item.gender === highlightGender) {
        return { color: highlightGender === 'feminine' ? 'gold' : 'lightblue', fontWeight: 'bold' };
      }
      if (highlightVerb && item.pos === 'verb') {
        return { color: 'green', fontWeight: 'bold' };
      }
      if (highlightParticle && item.pos !== 'noun' && item.pos !== 'verb') {
        return { color: 'blue', fontStyle: 'italic' };
      }
  
      return {};
    };
  
    return (
      <div>
        <h2>Surah {surah}</h2>
        <label htmlFor="surah-select">Select Surah: </label>
        <select id="surah-select" value={surah} onChange={(e) => setSurah(e.target.value)}>
          {Array.from({ length: 114 }, (_, i) => i + 1).map((sura) => (
            <option key={sura} value={sura}>
              {sura}
            </option>
          ))}
        </select>
  
        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', direction: 'rtl' }}>
          {surahNumber !== 9 && (
            <p style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' }}>{basmala}</p>
          )}
  
          {Object.entries(groupedByAya).map(([ayaIndex, ayaItems]) => {
            const isHighlighted = isAyaHighlighted(ayaIndex);
  
            return (
              <React.Fragment key={ayaIndex}>
                {/* Wrap AYA in a single span when marker is clicked */}
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: isHighlighted ? highlightColor : 'transparent',
                    borderRadius: '5px',
                    padding: '2px',
                  }}
                >
                  {ayaItems.map((item, index) => (
                    <React.Fragment key={item.item_id.low}>
                      <span
                        onClick={() =>
                          freeformMode
                            ? handleFreeformHighlight(item)
                            : handleSelectCorpusItem(item)
                        }
                        style={{
                          cursor: 'pointer',
                          ...getWordStyle(item),
                        }}
                      >
                        {item.arabic}
                      </span>
                      {index < ayaItems.length - 1 && ' '} {/* Add space between words */}
                    </React.Fragment>
                  ))}
                </span>
  
                {/* AYA Marker */}
                <span
                  onClick={() => freeformMode && handleFreeformAyaHighlight(parseInt(ayaIndex, 10))}
                  style={{
                    cursor: freeformMode ? 'pointer' : 'default',
                    color: 'gray',
                    fontWeight: 'bold',
                    marginLeft: '5px',
                  }}
                >
                  ﴿{ayaIndex}﴾
                </span>
  
                {layout === 'line-by-line' && <br />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderList = () => (
    <ul>
      {items.map(item => (
        <li key={item.item_id} onClick={() => handleSelectCorpusItem(item)} style={getWordStyle(item)}>
          {L2 === 'off' ? item[L1] : `${item[L1]} / ${item[L2]}`}
        </li>
      ))}
    </ul>
  );

  const renderPoetry = () => {
    // Group items by line_number
    const lines = items.reduce((acc, item) => {
      const lineNumber = item.line_number.low; // Use the `low` property directly
      if (!acc[lineNumber]) {
        acc[lineNumber] = [];
      }
      acc[lineNumber].push(item);
      return acc;
    }, {});
  
    // Sort lines by line_number
    const sortedLines = Object.entries(lines).sort(
      ([lineA], [lineB]) => Number(lineA) - Number(lineB)
    );
  
    return (
      <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', direction: 'rtl' }}>
        {sortedLines.map(([lineNumber, lineItems]) => (
          <p 
            key={lineNumber} 
            style={{
              display: 'inline-block', // Ensures lines are centered
              textAlign: 'center', 
              width: '100%' // Allows full width for proper centering
            }}
          >
            {lineItems
              .sort((a, b) => a.word_position.low - b.word_position.low) // Sort words within each line
              .map((item, index) => (
                <React.Fragment key={item.item_id.low}>
                  <span
                    onClick={() => handleSelectCorpusItem(item)}
                    style={{ cursor: 'pointer', ...getWordStyle(item) }}
                  >
                    {item.arabic}
                  </span>
                  {index < lineItems.length - 1 && " "} {/* Add space between words */}
                </React.Fragment>
              ))}
          </p>
        ))}
      </div>
    );
  };

  const renderProse = () => (
    <div>
      <h2>Prose</h2>
      {items.map((item) => (
        <p key={item.item_id} style={getWordStyle(item)}>
          {layout === 'line-by-line' ? `${item.line_number}. ${item.text}` : item.text}
        </p>
      ))}
    </div>
  );

  return (
    <div>
      {corpusId === '2' ? renderQuran() :
       corpusId === '1' ? renderList() :
       corpusId === '3' ? renderPoetry() : // Fallback for testing corpus ID 3
       <div>No valid corpus found. Please check the corpus configuration.</div>}
    </div>
  );
};

export default CorpusRenderer;