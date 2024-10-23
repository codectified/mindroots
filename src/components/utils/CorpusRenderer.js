import React from 'react';

const CorpusRenderer = ({ corpusId, corpusType, items, surah, aya, setSurah, setAya, ayaCount, L1, L2, handleSelectCorpusItem }) => {
  // Render Quran with Surah and Aya selection in prose format with proper Ayah markers
  const renderQuran = () => {
    let currentAya = null; // Track the current Ayah index for Ayah markers

    return (
      <div>
        <h2>Surah {surah}</h2>

        {/* Surah and Aya dropdowns */}
        <label htmlFor="surah-select">Select Surah: </label>
        <select id="surah-select" value={surah} onChange={(e) => setSurah(e.target.value)}>
          {Array.from({ length: 114 }, (_, i) => i + 1).map(sura => (
            <option key={sura} value={sura}>
              Surah {sura}
            </option>
          ))}
        </select>

        <label htmlFor="aya-select">Select Aya: </label>
        <select id="aya-select" value={aya} onChange={(e) => setAya(e.target.value)}>
          <option value={0}>All Ayas</option>
          {Array.from({ length: ayaCount }, (_, i) => i + 1).map(a => (
            <option key={a} value={a}>
              Aya {a}
            </option>
          ))}
        </select>

        {/* Render Quran items in prose format with Ayah markers */}
        <div style={{ whiteSpace: 'pre-wrap' }}> {/* Ensure text respects new lines */}
          {items.map((item, index) => {
            const showMarker = currentAya !== item.aya_index; // Check if the Ayah index has changed
            currentAya = item.aya_index; // Update current Ayah

            return (
              <span key={item.item_id}>
                <span
                  onClick={() => handleSelectCorpusItem(item)} // Make the word clickable
                  style={{ cursor: 'pointer' }} // Add cursor and style to show clickability
                >
                  {item.arabic}
                </span>
                {showMarker && <span> ﴿{item.aya_index}﴾ </span>} {/* Display Ayah marker only when it changes */}
                {" "} {/* Add space between words */}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // Render a simple list for corpus ID 1 (99 Names)
  const renderList = () => (
    <ul>
      {items.map(item => (
        <li key={item.item_id} onClick={() => handleSelectCorpusItem(item)}>
          {L2 === 'off' ? item[L1] : `${item[L1]} / ${item[L2]}`}
        </li>
      ))}
    </ul>
  );

  // Render Poetry by poem and line number
  const renderPoetry = () => (
    <div>
      <h2>Poetry</h2>
      {items.map((item, index) => (
        <p key={index}>
          {item.line_number}. {item.line_text}
        </p>
      ))}
    </div>
  );

  // Render Prose similarly to Quran, but without Ayah markers
  const renderProse = () => (
    <div>
      <h2>Prose</h2>
      {items.map((item, index) => (
        <p key={index}>{item.text}</p>
      ))}
    </div>
  );

  // Conditional rendering based on corpusId and corpusType
  if (corpusId === '2') {
    return renderQuran();
  } else if (corpusId === '1') {
    return renderList();
  } else if (corpusType === 'poetry') {
    return renderPoetry();
  } else if (corpusType === 'prose') {
    return renderProse();
  }

  return <div>No corpus selected</div>; // Default case if no matching corpus
};

export default CorpusRenderer;