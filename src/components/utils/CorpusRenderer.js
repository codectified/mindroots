import React, { useState, useEffect } from 'react';
import { useHighlight } from '../../contexts/HighlightContext';
import { useTextLayout } from '../../contexts/TextLayoutContext';
import { useCorpusStatistics } from '../../contexts/CorpusStatisticsContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { SURAHS, toArabicNumerals } from '../../constants/surahs';

const SURAH_MAP = Object.fromEntries(SURAHS.map(s => [s.number, s]));

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
  const [showQuranControls, setShowQuranControls] = useState(false);
  const [tempAyahsPerPage, setTempAyahsPerPage] = useState(ayahsPerPage);
  const [sortBy, setSortBy] = useState('original');
  const [sortOrder, setSortOrder] = useState('asc');
  const {
    highlightGender,
    highlightVerb,
    highlightParticle,
    freeformMode,
    highlightColor,
  } = useHighlight();
  const { layout } = useTextLayout();
  const { showStatistics } = useCorpusStatistics();

  useEffect(() => {
    setTempAyahsPerPage(ayahsPerPage);
  }, [ayahsPerPage]);

  const handleAyahsPerPageInputChange = (e) => {
    setTempAyahsPerPage(e.target.value);
  };

  const applyAyahsPerPageChange = () => {
    const validValue = Math.max(1, Math.min(50, parseInt(tempAyahsPerPage) || 10));
    setTempAyahsPerPage(validValue);
    setAyahsPerPage(validValue);
  };

  const handleAyahsPerPageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyAyahsPerPageChange();
      e.target.blur();
    }
  };

  const handleColumnSort = (sortType) => {
    if (sortBy === sortType) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortType);
      setSortOrder('asc');
    }
  };

  const getSortedItems = (itemsToSort) => {
    if (sortBy === 'original') return [...itemsToSort];

    const sorted = [...itemsToSort].sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'root_freq') {
        aVal = parseFloat(a.qrootfreq) || 0;
        bVal = parseFloat(b.qrootfreq) || 0;
      } else if (sortBy === 'word_freq') {
        aVal = parseFloat(a.quran_frequency) || 0;
        bVal = parseFloat(b.quran_frequency) || 0;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  };

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
        ? { ...item, isFreeformHighlighted: !isAyaCurrentlyHighlighted, highlightColor: !isAyaCurrentlyHighlighted ? highlightColor : null }
        : item
    );
    setItems(updatedItems);
  };

  const handleFreeformLineHighlight = (lineNumber) => {
    if (!freeformMode) return;
    const isLineCurrentlyHighlighted = items
      .filter((item) => item.line_number === lineNumber)
      .every((item) => item.isFreeformHighlighted);
    const updatedItems = items.map((item) =>
      item.line_number === lineNumber
        ? { ...item, isFreeformHighlighted: !isLineCurrentlyHighlighted, highlightColor: !isLineCurrentlyHighlighted ? highlightColor : null }
        : item
    );
    setItems(updatedItems);
  };

  // Dynamic highlight colors from user selection — must remain inline
  const getWordStyle = (item) => {
    if (item.isFreeformHighlighted) {
      return { backgroundColor: item.highlightColor || '#FF4500', borderRadius: '5px', padding: '2px' };
    }
    if (highlightGender && item.gender === highlightGender) {
      return { color: highlightGender === 'feminine' ? 'gold' : 'lightblue' };
    }
    if (highlightVerb && item.pos === 'verb') return { color: 'green' };
    if (highlightParticle && item.pos && item.pos !== 'noun' && item.pos !== 'verb') {
      return { color: 'blue' };
    }
    return {};
  };


  const renderQuran = () => {
    const basmala = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
    const surahNumber = Number(surah) || (items.length > 0 ? Number(items[0].sura_index) : null);

    const groupedByAya = items.reduce((acc, item) => {
      if (!acc[item.aya_index]) acc[item.aya_index] = [];
      acc[item.aya_index].push(item);
      return acc;
    }, {});

    const ayaNumbers = Object.keys(groupedByAya).map(Number).sort((a, b) => a - b);
    const currentStartAya = ayaNumbers.length > 0 ? ayaNumbers[0] : 1;
    const currentEndAya = ayaNumbers.length > 0 ? ayaNumbers[ayaNumbers.length - 1] : 1;
    const totalAyasInRange = ayaNumbers.length;

    const prevDisabled = surah <= 1 && currentStartAya <= 1;
    const nextDisabled = surah >= 114 && currentEndAya >= (ayaCount || 286);

    const navBtnCls =
      'py-2 px-4 min-w-[70px] border border-[#4a7c4a] rounded-md text-[14px] font-medium ' +
      'transition-all duration-200 flex items-center justify-center ' +
      'enabled:bg-[#4a7c4a] enabled:text-white enabled:cursor-pointer ' +
      'disabled:bg-[#f5f5f5] disabled:text-[#999] disabled:cursor-not-allowed';

    return (
      <div>
        <div className="quran-header mb-5 border border-[#a8d5a8] rounded-xl bg-[#f8fdf8] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <div className={`px-5 py-[15px] flex items-center justify-between ${showQuranControls ? 'border-b border-[#d4edd4]' : ''}`}>
            <h2 className="m-0 text-[20px] text-[#2d5a2d] font-semibold">
              {L1 === 'sem' ? toArabicNumerals(surah) : surah}. {SURAH_MAP[surah] ? (L1 === 'sem' ? SURAH_MAP[surah].arabic : SURAH_MAP[surah].english) : `Surah ${surah}`}
            </h2>

            <div className="flex items-center gap-[15px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentStartAya <= 1) {
                      if (surah > 1) { setSurah(surah - 1); setAya(-1); }
                    } else {
                      setAya(Math.max(1, currentStartAya - ayahsPerPage));
                    }
                  }}
                  disabled={prevDisabled}
                  className={navBtnCls}
                >
                  ← Prev
                </button>

                <button
                  onClick={() => {
                    if (currentEndAya >= (ayaCount || 286)) {
                      if (surah < 114) { setSurah(surah + 1); setAya(0); }
                    } else {
                      setAya(currentEndAya + 1);
                    }
                  }}
                  disabled={nextDisabled}
                  className={navBtnCls}
                >
                  Next →
                </button>
              </div>

              <button
                onClick={() => setShowQuranControls(!showQuranControls)}
                className={`bg-transparent border-none cursor-pointer py-2 px-3 rounded-md transition-colors duration-200 hover:bg-[#e8f5e8] ${showQuranControls ? 'bg-[#e8f5e8]' : ''}`}
              >
                <FontAwesomeIcon icon={faEllipsisV} className="text-[#4a7c4a] text-[16px]" />
              </button>
            </div>
          </div>

          {showQuranControls && (
            <div className="quran-controls p-5 flex flex-col gap-[15px]">
              <div className="surah-selector">
                <label htmlFor="surah-select">Select Surah: </label>
                <select
                  id="surah-select"
                  value={surah}
                  onChange={(e) => setSurah(e.target.value)}
                  className="px-[10px] py-[6px] border border-[#a8d5a8] rounded-md bg-white text-[14px] text-[#2d5a2d]"
                >
                  {SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {L1 === 'sem' ? toArabicNumerals(s.number) : s.number}. {L1 === 'sem' ? s.arabic : s.english}
                    </option>
                  ))}
                </select>
              </div>

              {totalAyasInRange > 0 && (
                <div className="aya-info text-[14px] text-muted">
                  <span className="aya-range-info">
                    Showing ayat {currentStartAya}
                    {currentEndAya !== currentStartAya ? `-${currentEndAya}` : ''}{' '}
                    out of {ayaCount || 286} total
                  </span>
                </div>
              )}

              <div className="ayah-controls flex items-center gap-[15px] flex-wrap">
                <div className="ayahs-per-page-control flex items-center gap-[5px]">
                  <label htmlFor="ayahs-per-page" className="text-[14px]">Ayahs per page:</label>
                  <input
                    id="ayahs-per-page"
                    type="number"
                    min="1"
                    max="50"
                    value={tempAyahsPerPage}
                    onChange={handleAyahsPerPageInputChange}
                    onBlur={applyAyahsPerPageChange}
                    onKeyDown={handleAyahsPerPageKeyDown}
                    className="w-[60px] p-[6px] border border-[#a8d5a8] rounded-md bg-white text-[14px] text-[#2d5a2d]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* fontSize is prop-driven; direction has no Tailwind utility — both stay inline */}
        <div
          className={`arabic whitespace-pre-wrap ${layout === 'prose' ? 'text-justify max-w-[800px] mx-auto px-5' : 'text-center'} ${layout === 'line-by-line' ? 'leading-[2.5]' : 'leading-[1.8]'}`}
          style={{ direction: 'rtl', fontSize: `${fontSize}px` }}
        >
          {surahNumber !== 9 && (
            <p className="mb-[10px] text-center font-bold">{basmala}</p>
          )}

          {Object.entries(groupedByAya).map(([ayaIndex, ayaItems]) => {
            const isAyaHighlighted = ayaItems.every((item) => item.isFreeformHighlighted);

            return (
              <React.Fragment key={ayaIndex}>
                {/* backgroundColor is user-supplied at runtime — must stay inline */}
                <span
                  className={`${layout === 'prose' ? 'inline' : 'inline-block'} rounded-[5px] p-[2px]`}
                  style={{ backgroundColor: isAyaHighlighted ? ayaItems[0].highlightColor : 'transparent' }}
                >
                  {ayaItems.map((item, index) => (
                    <React.Fragment key={item.item_id}>
                      <span
                        onClick={() => handleSelectCorpusItem(item)}
                        className="cursor-pointer"
                        style={getWordStyle(item)}
                      >
                        {L2 === 'off' ? (item[L1] || item.arabic) : `${item[L1] || item.arabic} / ${item[L2] || ''}`}
                      </span>
                      {index < ayaItems.length - 1 && ' '}
                    </React.Fragment>
                  ))}
                </span><span
                  onClick={(e) => {
                    e.stopPropagation();
                    freeformMode && handleFreeformAyaHighlight(parseInt(ayaIndex, 10));
                  }}
                  className={`${freeformMode ? 'cursor-pointer' : 'cursor-default'} text-gray-400 font-bold ml-[5px] ${layout === 'prose' ? 'mr-2' : 'mr-[5px]'}`}
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
      <div className={`corpus-list-container ${customClass}`} style={{ direction: 'ltr' }}>
        <div className="corpus-list-header">
          {/* Number column */}
          <div
            className="w-[50px] min-w-[50px] flex-shrink-0 text-center cursor-pointer select-none border-r border-border-light pr-3"
            onClick={() => handleColumnSort('original')}
          >
            <div className={`freq-label text-[11px] ${sortBy === 'original' ? 'text-[#2d5a2d]' : 'text-muted'}`}>
              № ↑
            </div>
          </div>

          {/* Name column */}
          <div className="flex-1 pl-3 text-right">
            <div className="freq-label text-muted text-[13px]">Name</div>
          </div>

          {L2 !== 'off' && (
            <div className="flex-1">
              <div className="freq-label text-muted text-[13px]"></div>
            </div>
          )}

          {showStatistics && (
            <div
              className="w-[110px] text-center flex-shrink-0 cursor-pointer select-none"
              onClick={() => handleColumnSort('root_freq')}
            >
              <div className={`freq-label ${sortBy === 'root_freq' ? 'text-[#2d5a2d]' : 'text-muted'}`}>
                Quranic Root<br />Frequency{getSortIndicator('root_freq')}
              </div>
            </div>
          )}
          {showStatistics && (
            <div
              className="w-[110px] text-center flex-shrink-0 cursor-pointer select-none"
              onClick={() => handleColumnSort('word_freq')}
            >
              <div className={`freq-label ${sortBy === 'word_freq' ? 'text-[#2d5a2d]' : 'text-muted'}`}>
                Quranic Word<br />Frequency{getSortIndicator('word_freq')}
              </div>
            </div>
          )}

          <div className="w-[150px] flex-shrink-0" />
        </div>

        {sortedItems.map((item, index) => (
          <div
            key={item.item_id}
            className="corpus-item-card"
            onClick={() => handleSelectCorpusItem(item)}
            style={getWordStyle(item)}
          >
            <div className="item-content">
              {/* Number */}
              <div className="w-[50px] min-w-[50px] text-center flex-shrink-0 text-muted font-medium border-r border-border-light pr-3">
                {item.item_id}
              </div>

              {/* Arabic name */}
              <div className="flex-1 pl-3">
                <div className="item-arabic text-right" style={{ fontSize: `${fontSize}px` }}>
                  {item[L1] || item.arabic || '—'}
                </div>
              </div>

              {L2 !== 'off' && (
                <div className="item-left">
                  <div className="item-english">{item[L2] || '—'}</div>
                  {item.transliteration && (
                    <div className="item-transliteration">{item.transliteration}</div>
                  )}
                </div>
              )}

              {showStatistics && (
                <div className="item-frequency">
                  <div className="freq-count">{item.qrootfreq || '—'}</div>
                </div>
              )}

              {showStatistics && (
                <div className="item-frequency">
                  <div className="freq-count">{item.quran_frequency || '—'}</div>
                </div>
              )}

              <div className="w-[150px] flex-shrink-0" />
            </div>
            {index < sortedItems.length - 1 && <div className="item-separator" />}
          </div>
        ))}
      </div>
    );
  };

  const renderPoetry = () => {
    const lines = items.reduce((acc, item) => {
      const lineNumber = item.line_number;
      if (!acc[lineNumber]) acc[lineNumber] = [];
      acc[lineNumber].push(item);
      return acc;
    }, {});

    const sortedLines = Object.entries(lines).sort(
      ([lineA], [lineB]) => Number(lineA) - Number(lineB)
    );

    return (
      <div
        className="arabic whitespace-pre-wrap text-center"
        style={{ direction: 'rtl', fontSize: `${fontSize}px` }}
      >
        {sortedLines.map(([lineNumber, lineItems]) => {
          const isLineHighlighted = lineItems.every((item) => item.isFreeformHighlighted);

          return (
            <React.Fragment key={lineNumber}>
              {/* backgroundColor is user-supplied at runtime — must stay inline */}
              <span
                className="inline-block rounded-[5px] p-[2px]"
                style={{ backgroundColor: isLineHighlighted ? lineItems[0].highlightColor : 'transparent' }}
              >
                {lineItems
                  .sort((a, b) => {
                    if (typeof a.item_id === 'string' && a.item_id.includes(':')) {
                      const [aS, aA, aW] = a.item_id.split(':').map(Number);
                      const [bS, bA, bW] = b.item_id.split(':').map(Number);
                      return aS - bS || aA - bA || aW - bW;
                    } else {
                      return a.item_id - b.item_id;
                    }
                  })
                  .map((item, index) => (
                    <React.Fragment key={item.item_id}>
                      <span
                        onClick={() => handleSelectCorpusItem(item)}
                        className="cursor-pointer"
                        style={getWordStyle(item)}
                      >
                        {L2 === 'off' ? (item[L1] || item.arabic) : `${item[L1] || item.arabic} / ${item[L2] || ''}`}
                      </span>
                      {index < lineItems.length - 1 && " "}
                    </React.Fragment>
                  ))}
              </span>

              <span
                onClick={(e) => {
                  e.stopPropagation();
                  freeformMode && handleFreeformLineHighlight(Number(lineNumber));
                }}
                className={`${freeformMode ? 'cursor-pointer' : 'cursor-default'} text-gray-400 font-bold ml-[5px]`}
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
       corpusId === '3' ? renderPoetry() :
       <div>No valid corpus found. Please check the corpus configuration.</div>}
    </div>
  );
};

export default CorpusRenderer;
