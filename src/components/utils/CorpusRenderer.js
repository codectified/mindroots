import React, { useState } from 'react';
import { useHighlight } from '../../contexts/HighlightContext';
import { useTextLayout } from '../../contexts/TextLayoutContext';

// Basic Surah names mapping (first 20 for demonstration)
const SURAH_NAMES = {
  1: "Al-Fatiha", 2: "Al-Baqara", 3: "Al-Imran", 4: "An-Nisa", 5: "Al-Maida",
  6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Tawba", 10: "Yunus",
  11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
  16: "An-Nahl", 17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Ta-Ha"
  // TODO: Add remaining 94 surah names
};

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
  ayahsPerPage,
  setAyahsPerPage,
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
    if (!freeformMode) return;
  
    const updatedItems = items.map((currentItem) =>
      currentItem.item_id === item.item_id
        ? {
            ...currentItem,
            isFreeformHighlighted: !currentItem.isFreeformHighlighted, // Toggle highlight
            highlightColor: !currentItem.isFreeformHighlighted ? highlightColor : currentItem.highlightColor, // Preserve color
          }
        : currentItem // Leave other items unchanged
    );
  
    setItems(updatedItems);
  };

  const handleFreeformAyaHighlight = (ayaIndex) => {
    if (!freeformMode) return;
  
    const isAyaCurrentlyHighlighted = items
      .filter((item) => item.aya_index === ayaIndex)
      .every((item) => item.isFreeformHighlighted);
  
    const updatedItems = items.map((item) =>
      item.aya_index === ayaIndex
        ? {
            ...item,
            isFreeformHighlighted: !isAyaCurrentlyHighlighted, // Toggle highlight
            highlightColor: !isAyaCurrentlyHighlighted ? highlightColor : null, // Set or clear color
          }
        : item // Leave other items unchanged
    );
  
    setItems(updatedItems);
  };

  // Toggles freeform highlight state for a poetry line
const handleFreeformLineHighlight = (lineNumber) => {
  if (!freeformMode) return;

  const isLineCurrentlyHighlighted = items
    .filter((item) => item.line_number === lineNumber)
    .every((item) => item.isFreeformHighlighted);

  const updatedItems = items.map((item) =>
    item.line_number === lineNumber
      ? {
          ...item,
          isFreeformHighlighted: !isLineCurrentlyHighlighted, // Toggle highlight
          highlightColor: !isLineCurrentlyHighlighted ? highlightColor : null, // Set or clear color
        }
      : item // Leave other items unchanged
  );

  setItems(updatedItems);
};

  // Adjust styles based on highlight settings and Freeform Mode
  const getWordStyle = (item) => {
    if (item.isFreeformHighlighted) {
      return { backgroundColor: item.highlightColor || '#FF4500', borderRadius: '5px', padding: '2px' };
    }
    if (highlightGender && item.gender === highlightGender) {
      return { color: highlightGender === 'feminine' ? 'gold' : 'lightblue'};
    }
    if (highlightVerb && item.pos === 'verb') {
      return { color: 'green'};
    }
    // Only highlight as particle if pos property exists and is neither noun nor verb
    if (highlightParticle && item.pos && item.pos !== 'noun' && item.pos !== 'verb') {
      return { color: 'blue'};
    }
    return {};
  };


  const renderQuran = () => {
    const basmala = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
    const surahNumber = Number(surah) || (items.length > 0 ? Number(items[0].sura_index) : null);
  
    // Group items by AYA index
    const groupedByAya = items.reduce((acc, item) => {
      if (!acc[item.aya_index]) acc[item.aya_index] = [];
      acc[item.aya_index].push(item);
      return acc;
    }, {});
  
    // Get current aya range info
    const ayaNumbers = Object.keys(groupedByAya).map(Number).sort((a, b) => a - b);
    const currentStartAya = ayaNumbers.length > 0 ? ayaNumbers[0] : 1;
    const currentEndAya = ayaNumbers.length > 0 ? ayaNumbers[ayaNumbers.length - 1] : 1;
    const totalAyasInRange = ayaNumbers.length;

    return (
      <div>
        <div className="quran-header" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>{surah}. {SURAH_NAMES[surah] || `Surah ${surah}`}</h2>
          <div className="quran-controls" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="surah-selector">
              <label htmlFor="surah-select">Select Surah: </label>
              <select id="surah-select" value={surah} onChange={(e) => setSurah(e.target.value)}>
                {Array.from({ length: 114 }, (_, i) => i + 1).map((sura) => (
                  <option key={sura} value={sura}>
                    {sura}. {SURAH_NAMES[sura] || `Surah ${sura}`}
                  </option>
                ))}
              </select>
            </div>
            
            {totalAyasInRange > 0 && (
              <div className="aya-info" style={{ fontSize: '14px', color: '#666' }}>
                <span className="aya-range-info">
                  Showing Ayat {currentStartAya}
                  {currentEndAya !== currentStartAya ? `-${currentEndAya}` : ''} 
                  ({totalAyasInRange} verse{totalAyasInRange !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            
            <div className="ayah-controls" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <div className="ayahs-per-page-control" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <label htmlFor="ayahs-per-page" style={{ fontSize: '14px' }}>Ayahs per page:</label>
                <input 
                  id="ayahs-per-page"
                  type="number" 
                  min="1" 
                  max="50" 
                  value={ayahsPerPage}
                  onChange={(e) => setAyahsPerPage(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                  style={{ 
                    width: '60px', 
                    padding: '4px', 
                    border: '1px solid #ccc', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div className="aya-navigation" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={() => setAya(Math.max(1, currentStartAya - ayahsPerPage))}
                  disabled={currentStartAya <= 1}
                  className="nav-button"
                  style={{ 
                    padding: '8px 12px', 
                    border: '1px solid #007cba', 
                    borderRadius: '4px',
                    backgroundColor: currentStartAya <= 1 ? '#f5f5f5' : '#007cba',
                    color: currentStartAya <= 1 ? '#999' : '#fff',
                    cursor: currentStartAya <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ← Previous {ayahsPerPage}
                </button>
                
                <span className="current-aya" style={{ 
                  minWidth: '120px', 
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Ayahs {currentStartAya}-{currentEndAya}
                </span>
                
                <button 
                  onClick={() => setAya(currentEndAya + 1)}
                  disabled={currentEndAya >= (ayaCount || 286)}
                  className="nav-button"
                  style={{ 
                    padding: '8px 12px', 
                    border: '1px solid #007cba', 
                    borderRadius: '4px',
                    backgroundColor: currentEndAya >= (ayaCount || 286) ? '#f5f5f5' : '#007cba',
                    color: currentEndAya >= (ayaCount || 286) ? '#999' : '#fff',
                    cursor: currentEndAya >= (ayaCount || 286) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Next {ayahsPerPage} →
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          textAlign: layout === 'prose' ? 'justify' : 'center', 
          direction: 'rtl',
          maxWidth: layout === 'prose' ? '800px' : 'none',
          margin: layout === 'prose' ? '0 auto' : '0',
          padding: layout === 'prose' ? '0 20px' : '0',
          lineHeight: layout === 'line-by-line' ? '2.5' : '1.8'
        }}>
          {surahNumber !== 9 && (
            <p style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' }}>{basmala}</p>
          )}
  
          {Object.entries(groupedByAya).map(([ayaIndex, ayaItems]) => {
            const isAyaHighlighted = ayaItems.every((item) => item.isFreeformHighlighted);
  
            return (
              <React.Fragment key={ayaIndex}>
                {/* Words within the AYA */}
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: isAyaHighlighted ? ayaItems[0].highlightColor : 'transparent',
                    borderRadius: '5px',
                    padding: '2px',
                  }}
                >
                  {ayaItems.map((item, index) => (
                    <React.Fragment key={item.item_id}>
                      <span
                        onClick={() => handleSelectCorpusItem(item)} // Render graph visualization
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
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent word-level logic
                    freeformMode && handleFreeformAyaHighlight(parseInt(ayaIndex, 10));
                  }}
                  style={{
                    cursor: freeformMode ? 'pointer' : 'default',
                    color: 'gray',
                    fontWeight: 'bold',
                    marginLeft: '5px',
                  }}
                >
                  ﴿{ayaIndex}﴾
                </span>
  
                {layout === 'line-by-line' ? <br /> : ' '}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderList = (customClass = '') => (
    <ul className={`corpus-renderer-list ${customClass}`}>
      {items.map((item) => (
        <li
          key={item.item_id}
          onClick={() => handleSelectCorpusItem(item)}
          style={getWordStyle(item)}
        >
          {L2 === 'off' ? item[L1] : `${item[L1]} / ${item[L2]}`}
        </li>
      ))}
    </ul>
  );

  const renderPoetry = () => {
    // Group items by line_number
    const lines = items.reduce((acc, item) => {
      const lineNumber = item.line_number;
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
        {sortedLines.map(([lineNumber, lineItems]) => {
          const isLineHighlighted = lineItems.every((item) => item.isFreeformHighlighted);
  
          return (
            <React.Fragment key={lineNumber}>
              {/* Poetry line */}
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: isLineHighlighted ? lineItems[0].highlightColor : 'transparent',
                  borderRadius: '5px',
                  padding: '2px',
                }}
              >
                {lineItems
                  .sort((a, b) => a.item_id - b.item_id) // Sort words within each line by item_id
                  .map((item, index) => (
                    <React.Fragment key={item.item_id}>
                      <span
                        onClick={() => handleSelectCorpusItem(item)} // Render graph visualization
                        style={{
                          cursor: 'pointer',
                          ...getWordStyle(item),
                        }}
                      >
                        {item.arabic}
                      </span>
                      {index < lineItems.length - 1 && " "} {/* Add space between words */}
                    </React.Fragment>
                  ))}
              </span>
  
              {/* Line marker */}
              <span
                onClick={(e) => {
                  e.stopPropagation(); // Prevent word-level logic
                  freeformMode && handleFreeformLineHighlight(Number(lineNumber));
                }}
                style={{
                  cursor: freeformMode ? 'pointer' : 'default',
                  color: 'gray',
                  fontWeight: 'bold',
                  marginLeft: '5px',
                }}
              >
                ** {lineNumber} **
              </span>
  
              {layout === 'line-by-line' && <br />}
            </React.Fragment>
          );
        })}
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