import React from 'react';
import { useHighlight } from '../../contexts/HighlightContext';

const CorpusRenderer = ({ corpusId, corpusType, items, surah, aya, setSurah, setAya, ayaCount, L1, L2, handleSelectCorpusItem }) => {
  const { highlightGender } = useHighlight();

  const getWordStyle = (item) => {
    if (highlightGender && item.gender === highlightGender) {
      return { color: highlightGender === 'feminine' ? 'pink' : 'lightblue', fontWeight: 'bold' };
    }
    return {}; // Default style
  };

  const renderQuran = () => {
    const basmala = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  
    // Attempt to parse `surah` as a number, or fall back to `sura_index` from `items`
    const surahNumber = Number(surah) || (items.length > 0 ? Number(items[0].sura_index.low) : null);
  
    return (
      <div>
        <h2>Surah {surah}</h2>
        <label htmlFor="surah-select">Select Surah: </label>
        <select id="surah-select" value={surah} onChange={(e) => setSurah(e.target.value)}>
          {Array.from({ length: 114 }, (_, i) => i + 1).map(sura => (
            <option key={sura} value={sura}>{sura}</option>
          ))}
        </select>
        {/* <label htmlFor="aya-select">Select Aya: </label>
        <select id="aya-select" value={aya} onChange={(e) => setAya(e.target.value)}>
          <option value={0}>All Ayas</option>
          {Array.from({ length: ayaCount }, (_, i) => i + 1).map(a => (
            <option key={a} value={a}>Aya {a}</option>
          ))}
        </select> */}
  
        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', direction: 'rtl' }}>
          {/* Display Basmala only if this isn't Surah 9 */}
          {surahNumber !== 9 && (
            <p style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' }}>{basmala}</p>
          )}
  
          {items.map((item, index) => {
            const isEndOfAya = index === items.length - 1 || items[index + 1].aya_index !== item.aya_index;
  
            return (
              <span key={item.item_id.low}>
                <span
                  onClick={() => handleSelectCorpusItem(item)}
                  style={{ cursor: 'pointer', ...getWordStyle(item) }}
                >
                  {item.arabic}
                </span>
                {" "} {/* Add space between words */}
                {isEndOfAya && <span> ﴿{item.aya_index.low}﴾ </span>} {/* Display Ayah marker */}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // Render List items with gender highlighting
  const renderList = () => (
    <ul>
      {items.map(item => (
        <li key={item.item_id} onClick={() => handleSelectCorpusItem(item)} style={getWordStyle(item)}>
          {L2 === 'off' ? item[L1] : `${item[L1]} / ${item[L2]}`}
        </li>
      ))}
    </ul>
  );

  // Render Poetry items with gender highlighting
  const renderPoetry = () => (
    <div>
      <h2>Poetry</h2>
      {items.map((item) => (
        <p key={item.item_id} style={getWordStyle(item)}>
          {item.line_number}. {item.line_text}
        </p>
      ))}
    </div>
  );

  // Render Prose items with gender highlighting
  const renderProse = () => (
    <div>
      <h2>Prose</h2>
      {items.map((item) => (
        <p key={item.item_id} style={getWordStyle(item)}>
          {item.text}
        </p>
      ))}
    </div>
  );

  return (
    <div>
      {corpusId === '2' ? renderQuran() :
       corpusId === '1' ? renderList() :
       corpusType === 'poetry' ? renderPoetry() :
       corpusType === 'prose' ? renderProse() :
       <div>No corpus selected</div>}
    </div>
  );
};

export default CorpusRenderer;