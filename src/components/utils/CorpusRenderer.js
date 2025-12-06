import React, { useState, useEffect } from 'react';
import { useHighlight } from '../../contexts/HighlightContext';
import { useTextLayout } from '../../contexts/TextLayoutContext';
import { useCorpusStatistics } from '../../contexts/CorpusStatisticsContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';

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
  fontSize = 16,
  L1,
  L2,
  handleSelectCorpusItem,
}) => {
  const [showQuranControls, setShowQuranControls] = useState(false); // Quran controls collapsed by default
  const [tempAyahsPerPage, setTempAyahsPerPage] = useState(ayahsPerPage); // Local state for input
  const [sortBy, setSortBy] = useState('original'); // 'original', 'root_freq', 'word_freq'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const {
    highlightGender,
    highlightVerb,
    highlightParticle,
    freeformMode,
    highlightColor, // Access the selected highlight color
  } = useHighlight();
  const { layout } = useTextLayout(); // Access the text layout setting
  const { showStatistics } = useCorpusStatistics(); // Access statistics visibility toggle

  // Sync temp state with parent prop changes
  useEffect(() => {
    setTempAyahsPerPage(ayahsPerPage);
  }, [ayahsPerPage]);

  // Handle input changes without immediately applying them
  const handleAyahsPerPageInputChange = (e) => {
    const value = e.target.value;
    setTempAyahsPerPage(value);
  };

  // Apply changes on blur or explicit confirmation
  const applyAyahsPerPageChange = () => {
    const validValue = Math.max(1, Math.min(50, parseInt(tempAyahsPerPage) || 10));
    setTempAyahsPerPage(validValue);
    setAyahsPerPage(validValue);
  };

  // Prevent form submission on Enter key
  const handleAyahsPerPageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyAyahsPerPageChange();
      e.target.blur(); // Remove focus after applying
    }
  };

  // Handle column sorting
  const handleColumnSort = (sortType) => {
    // If clicking the same column, toggle sort order; otherwise reset to ascending
    if (sortBy === sortType) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortType);
      setSortOrder('asc');
    }
  };

  // Get sorted items based on current sort configuration
  const getSortedItems = (itemsToSort) => {
    if (sortBy === 'original') {
      // Return in original order
      return [...itemsToSort];
    }

    const sorted = [...itemsToSort].sort((a, b) => {
      let aVal, bVal;

      if (sortBy === 'root_freq') {
        aVal = parseFloat(a.qrootfreq) || 0;
        bVal = parseFloat(b.qrootfreq) || 0;
      } else if (sortBy === 'word_freq') {
        aVal = parseFloat(a.quran_frequency) || 0;
        bVal = parseFloat(b.quran_frequency) || 0;
      }

      if (sortOrder === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    return sorted;
  };

  // Get sort indicator for column headers
  const getSortIndicator = (columnType) => {
    if (sortBy !== columnType) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
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
        <div className="quran-header" style={{ 
          marginBottom: '20px', 
          border: '1px solid #a8d5a8', 
          borderRadius: '12px',
          backgroundColor: '#f8fdf8',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {/* Collapsed header with surah name and nav buttons */}
          <div style={{ 
            padding: '15px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: showQuranControls ? '1px solid #d4edd4' : 'none'
          }}>
            <h2 style={{ 
              margin: '0', 
              fontSize: '20px', 
              color: '#2d5a2d',
              fontWeight: '600'
            }}>
              {surah}. {SURAH_NAMES[surah] || `Surah ${surah}`}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Quick navigation buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => {
                    if (currentStartAya <= 1) {
                      // Go to previous surah
                      if (surah > 1) {
                        setSurah(surah - 1);
                        setAya(-1); // Will load from the end of previous surah
                      }
                    } else {
                      setAya(Math.max(1, currentStartAya - ayahsPerPage));
                    }
                  }}
                  disabled={surah <= 1 && currentStartAya <= 1}
                  style={{ 
                    padding: '8px 16px', 
                    minWidth: '70px',
                    border: '1px solid #4a7c4a', 
                    borderRadius: '6px',
                    backgroundColor: (surah <= 1 && currentStartAya <= 1) ? '#f5f5f5' : '#4a7c4a',
                    color: (surah <= 1 && currentStartAya <= 1) ? '#999' : '#fff',
                    cursor: (surah <= 1 && currentStartAya <= 1) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ← Prev
                </button>
                
                <button 
                  onClick={() => {
                    if (currentEndAya >= (ayaCount || 286)) {
                      // Go to next surah
                      if (surah < 114) {
                        setSurah(surah + 1);
                        setAya(0); // Will load from the beginning of next surah
                      }
                    } else {
                      setAya(currentEndAya + 1);
                    }
                  }}
                  disabled={surah >= 114 && currentEndAya >= (ayaCount || 286)}
                  style={{ 
                    padding: '8px 16px', 
                    minWidth: '70px',
                    border: '1px solid #4a7c4a', 
                    borderRadius: '6px',
                    backgroundColor: (surah >= 114 && currentEndAya >= (ayaCount || 286)) ? '#f5f5f5' : '#4a7c4a',
                    color: (surah >= 114 && currentEndAya >= (ayaCount || 286)) ? '#999' : '#fff',
                    cursor: (surah >= 114 && currentEndAya >= (ayaCount || 286)) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Next →
                </button>
              </div>
              
              {/* Three dots to expand full controls */}
              <button 
                onClick={() => setShowQuranControls(!showQuranControls)}
                style={{ 
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s',
                  backgroundColor: showQuranControls ? '#e8f5e8' : 'transparent'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e8f5e8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = showQuranControls ? '#e8f5e8' : 'transparent'}
              >
                <FontAwesomeIcon 
                  icon={faEllipsisV} 
                  style={{ 
                    color: '#4a7c4a', 
                    fontSize: '16px' 
                  }}
                />
              </button>
            </div>
          </div>

          {/* Expanded controls */}
          {showQuranControls && (
            <div className="quran-controls" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="surah-selector">
              <label htmlFor="surah-select">Select Surah: </label>
              <select 
                id="surah-select" 
                value={surah} 
                onChange={(e) => setSurah(e.target.value)}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #a8d5a8',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  fontSize: '14px',
                  color: '#2d5a2d'
                }}
              >
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
                  Showing ayat {currentStartAya}
                  {currentEndAya !== currentStartAya ? `-${currentEndAya}` : ''}{' '}
                  out of {ayaCount || 286} total
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
                  value={tempAyahsPerPage}
                  onChange={handleAyahsPerPageInputChange}
                  onBlur={applyAyahsPerPageChange}
                  onKeyDown={handleAyahsPerPageKeyDown}
                  style={{ 
                    width: '60px', 
                    padding: '6px', 
                    border: '1px solid #a8d5a8', 
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                    color: '#2d5a2d'
                  }}
                />
              </div>
              
            </div>
            </div>
          )}
        </div>
  
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          textAlign: layout === 'prose' ? 'justify' : 'center', 
          direction: 'rtl',
          maxWidth: layout === 'prose' ? '800px' : 'none',
          margin: layout === 'prose' ? '0 auto' : '0',
          padding: layout === 'prose' ? '0 20px' : '0',
          lineHeight: layout === 'line-by-line' ? '2.5' : '1.8',
          fontSize: `${fontSize}px`
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
                    display: layout === 'prose' ? 'inline' : 'inline-block',
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
                        {L2 === 'off' ? (item[L1] || item.arabic) : `${item[L1] || item.arabic} / ${item[L2] || ''}`}
                      </span>
                      {index < ayaItems.length - 1 && ' '} {/* Add space between words */}
                    </React.Fragment>
                  ))}
                </span><span
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent word-level logic
                    freeformMode && handleFreeformAyaHighlight(parseInt(ayaIndex, 10));
                  }}
                  style={{
                    cursor: freeformMode ? 'pointer' : 'default',
                    color: 'gray',
                    fontWeight: 'bold',
                    marginLeft: '5px',
                    marginRight: layout === 'prose' ? '8px' : '5px', // Add space after ayah marker in prose
                  }}
                >
                  ﴿{ayaIndex}﴾
                </span>{layout === 'line-by-line' && <br />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderList = (customClass = '') => {
    const sortedItems = getSortedItems(items);

    return (
    <div className={`corpus-list-container ${customClass}`}>
      {/* Header Row */}
      <div className="corpus-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '12px 24px' }}>
        {L2 !== 'off' && <div style={{ flex: 1 }} />}
        {showStatistics && (
          <div
            style={{ width: '110px', textAlign: 'center', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleColumnSort('root_freq')}
          >
            <div className="freq-label" style={{ color: sortBy === 'root_freq' ? '#2d5a2d' : '#666' }}>
              Quranic Root<br />Frequency{getSortIndicator('root_freq')}
            </div>
          </div>
        )}
        {showStatistics && (
          <div
            style={{ width: '110px', textAlign: 'center', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleColumnSort('word_freq')}
          >
            <div className="freq-label" style={{ color: sortBy === 'word_freq' ? '#2d5a2d' : '#666' }}>
              Quranic Word<br />Frequency{getSortIndicator('word_freq')}
            </div>
          </div>
        )}
        <div style={{ flex: '0 0 150px' }} />
      </div>

      {/* Data Rows */}
      {sortedItems.map((item, index) => (
        <div
          key={item.item_id}
          className="corpus-item-card"
          onClick={() => handleSelectCorpusItem(item)}
          style={getWordStyle(item)}
        >
          <div className="item-content">
            {/* Left side: L2 language (if set) */}
            {L2 !== 'off' && (
              <div className="item-left">
                <div className="item-english">{item[L2] || '—'}</div>
                {item.transliteration && (
                  <div className="item-transliteration">{item.transliteration}</div>
                )}
              </div>
            )}

            {/* Center-Left: Quranic Root Frequency */}
            {showStatistics && (
              <div className="item-frequency">
                <div className="freq-count">{item.qrootfreq || '—'}</div>
              </div>
            )}

            {/* Center-Right: Word Frequency */}
            {showStatistics && (
              <div className="item-frequency">
                <div className="freq-count">{item.quran_frequency || '—'}</div>
              </div>
            )}

            {/* Right side: Arabic */}
            <div className="item-right">
              <div className="item-arabic" style={{ fontSize: `${fontSize}px` }}>
                {item[L1] || item.arabic || '—'}
              </div>
            </div>
          </div>
          {index < sortedItems.length - 1 && <div className="item-separator" />}
        </div>
      ))}
    </div>
    );
  };

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
      <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', direction: 'rtl', fontSize: `${fontSize}px` }}>
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
                  .sort((a, b) => {
                    // Handle different ID formats by corpus
                    if (typeof a.item_id === 'string' && a.item_id.includes(':')) {
                      // Hierarchical IDs (Corpus 2): surah:ayah:word
                      const [aS, aA, aW] = a.item_id.split(':').map(Number);
                      const [bS, bA, bW] = b.item_id.split(':').map(Number);
                      return aS - bS || aA - bA || aW - bW;
                    } else {
                      // Integer IDs (Corpus 1 & 3): simple numeric comparison
                      return a.item_id - b.item_id;
                    }
                  }) // Sort words within each line by position
                  .map((item, index) => (
                    <React.Fragment key={item.item_id}>
                      <span
                        onClick={() => handleSelectCorpusItem(item)} // Render graph visualization
                        style={{
                          cursor: 'pointer',
                          ...getWordStyle(item),
                        }}
                      >
                        {L2 === 'off' ? (item[L1] || item.arabic) : `${item[L1] || item.arabic} / ${item[L2] || ''}`}
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