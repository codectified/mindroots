import React from 'react';
import { useHighlight } from '../../contexts/HighlightContext';
import { useTextLayout } from '../../contexts/TextLayoutContext';

const CorpusRenderer = ({ corpusId, corpusType, items, surah, aya, setSurah, setAya, ayaCount, L1, L2, handleSelectCorpusItem }) => {
  const { highlightGender, highlightVerb, highlightParticle } = useHighlight();
  const { layout } = useTextLayout(); // Access the text layout setting

  const getWordStyle = (item) => {
    // Highlighting logic for gender, verbs, and particles
    if (highlightGender && item.gender === highlightGender) {
      return { color: highlightGender === 'feminine' ? 'gold' : 'lightblue', fontWeight: 'bold' };
    }
    if (highlightVerb && item.pos === 'verb') {
      return { color: 'green', fontWeight: 'bold' };
    }
    if (highlightParticle && item.pos !== 'noun' && item.pos !== 'verb') {
      return { color: 'blue', fontStyle: 'bold' };
    }
    return {};
  };

  const renderQuran = () => {
    const basmala = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
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

        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', direction: 'rtl' }}>
          {surahNumber !== 9 && (
            <p style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' }}>{basmala}</p>
          )}
          
          {items.map((item, index) => {
            const isEndOfAya = index === items.length - 1 || items[index + 1].aya_index !== item.aya_index;

            return (
              <React.Fragment key={item.item_id.low}>
                <span
                  onClick={() => handleSelectCorpusItem(item)}
                  style={{ cursor: 'pointer', ...getWordStyle(item) }}
                >
                  {item.arabic}
                </span>
                
                {" "} {/* Add space between words */}
                
                {/* Add Ayah marker and/or line break conditionally */}
                {isEndOfAya && (
                  <>
                    <span> ﴿{item.aya_index.low}﴾ </span> {/* Ayah marker */}
                    {layout === 'line-by-line' && <br />} {/* Line break if line-by-line layout */}
                  </>
                )}
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

  const renderPoetry = () => (
    <div>
      <h2>Poetry</h2>
      {items.map((item) => (
        <p key={item.item_id} style={getWordStyle(item)}>
          {layout === 'line-by-line' ? `${item.line_number}. ${item.line_text}` : item.line_text}
        </p>
      ))}
    </div>
  );

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
       corpusType === 'poetry' ? renderPoetry() :
       corpusType === 'prose' ? renderProse() :
       <div>No corpus selected</div>}
    </div>
  );
};

export default CorpusRenderer;