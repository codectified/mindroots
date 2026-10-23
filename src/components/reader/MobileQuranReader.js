import React, { useEffect, useRef, useState } from 'react';
import { SURAHS, toArabicNumerals } from '../../constants/surahs';
import styles from './MobileQuranReader.module.css';

// Touch-first Quran reader, modelled on quran.com's translation view: one cell
// per ayah (verse key + menu, word-by-word Arabic, hairline separator), big tap
// targets, sticky surah bar and a bottom pager. See THIRD_PARTY_NOTICES.md.
//
// Behaviour is shared with the desktop renderer through props: tapping a word
// calls onWordTap (same as clicking a word on desktop), tapping the ayah number
// or ⋯ calls onAyahMenu (same as clicking ﴿N﴾ on desktop).

const SURAH_MAP = Object.fromEntries(SURAHS.map(s => [s.number, s]));
const BASMALA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
const TRANSLIT_KEY = 'mobileReader.showTransliteration';
const GLOSS_KEY = 'mobileReader.showGloss';

const readPref = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === 'true';
  } catch {
    return fallback;
  }
};

const writePref = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* private mode: keep the in-memory toggle only */
  }
};

const MobileQuranReader = ({
  surah,
  setSurah,
  groupedByAya,
  nav,
  ayaCount,
  L1,
  L2,
  fontSize,
  getWordStyle,
  onWordTap,
  onAyahMenu,
}) => {
  const [showTranslit, setShowTranslit] = useState(() => readPref(TRANSLIT_KEY, false));
  const [showGloss, setShowGloss] = useState(() => readPref(GLOSS_KEY, true));
  const surahNumber = Number(surah);
  const meta = SURAH_MAP[surahNumber];
  const ayaEntries = Object.entries(groupedByAya);
  const firstKey = ayaEntries.length ? ayaEntries[0][0] : null;

  // New page of ayat → start reading from the top
  const lastFirstKey = useRef(null);
  useEffect(() => {
    if (firstKey === null) return;
    const pageKey = `${surahNumber}:${firstKey}`;
    if (lastFirstKey.current !== null && lastFirstKey.current !== pageKey) {
      window.scrollTo({ top: 0 });
    }
    lastFirstKey.current = pageKey;
  }, [surahNumber, firstKey]);

  const toggleTranslit = () => {
    setShowTranslit(!showTranslit);
    writePref(TRANSLIT_KEY, !showTranslit);
  };
  const toggleGloss = () => {
    setShowGloss(!showGloss);
    writePref(GLOSS_KEY, !showGloss);
  };

  const num = (n) => (L1 === 'sem' ? toArabicNumerals(n) : n);
  const atSurahEnd = nav.currentEndAya >= (ayaCount || 286);
  const atSurahStart = nav.currentStartAya <= 1;

  return (
    <div className={styles.reader} style={{ '--qr-scale': (fontSize || 16) / 16 }}>
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={nav.onPrev}
          disabled={nav.prevDisabled}
          aria-label="Previous"
        >
          ‹
        </button>
        <select
          className={styles.surahSelect}
          value={surahNumber}
          onChange={(e) => setSurah(Number(e.target.value))}
          aria-label="Surah"
        >
          {SURAHS.map((s) => (
            <option key={s.number} value={s.number}>
              {num(s.number)}. {L1 === 'sem' ? s.arabic : s.english}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`${styles.iconBtn} ${showTranslit ? styles.iconBtnActive : ''}`}
          onClick={toggleTranslit}
          aria-pressed={showTranslit}
          aria-label="Show transliteration"
        >
          Aa
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${showGloss ? styles.iconBtnActive : ''}`}
          onClick={toggleGloss}
          aria-pressed={showGloss}
          aria-label="Show word meanings"
        >
          EN
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={nav.onNext}
          disabled={nav.nextDisabled}
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <div className={styles.chapterHeader}>
        <div className={styles.chapterNameArabic}>{meta ? meta.arabic : surahNumber}</div>
        <div className={styles.chapterNameLatin}>
          {surahNumber}. {meta ? meta.english : `Surah ${surahNumber}`}
        </div>
        {ayaEntries.length > 0 && (
          <div className={styles.range}>
            Ayat {nav.currentStartAya}
            {nav.currentEndAya !== nav.currentStartAya ? `–${nav.currentEndAya}` : ''} of{' '}
            {ayaCount || '…'}
          </div>
        )}
      </div>

      {/* Al-Fatiha's basmala is its own ayah 1; at-Tawba has none */}
      {surahNumber !== 1 && surahNumber !== 9 && atSurahStart && <div className={styles.basmala}>{BASMALA}</div>}

      {ayaEntries.map(([ayaIndex, ayaItems]) => {
        const isAyaHighlighted = ayaItems.every((item) => item.isFreeformHighlighted);
        return (
          <React.Fragment key={ayaIndex}>
            {/* backgroundColor is user-supplied at runtime — must stay inline */}
            <div
              className={styles.cell}
              style={isAyaHighlighted ? { backgroundColor: ayaItems[0].highlightColor } : undefined}
            >
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.verseKey}
                  onClick={(e) => onAyahMenu(e, ayaIndex)}
                >
                  {surahNumber}:{ayaIndex}
                </button>
                <button
                  type="button"
                  className={styles.menuBtn}
                  onClick={(e) => onAyahMenu(e, ayaIndex)}
                  aria-label={`Ayah ${surahNumber}:${ayaIndex} options`}
                >
                  ⋯
                </button>
              </div>

              <div className={styles.verseText} translate="no">
                {ayaItems.map((item) => {
                  // Word meaning: the chosen second language, else the English gloss
                  const gloss = showGloss ? (L2 !== 'off' && item[L2]) || item.english : null;
                  return (
                    <span
                      key={item.item_id}
                      role="button"
                      tabIndex={0}
                      className={styles.word}
                      style={getWordStyle(item)}
                      onClick={() => onWordTap(item)}
                      onKeyDown={(e) => e.key === 'Enter' && onWordTap(item)}
                    >
                      <span className={styles.arabic} lang="ar">
                        {item[L1] || item.arabic}
                      </span>
                      {showTranslit && item.transliteration && (
                        <span className={styles.wbw}>{item.transliteration}</span>
                      )}
                      {gloss && <span className={styles.gloss}>{gloss}</span>}
                    </span>
                  );
                })}
                <button
                  type="button"
                  className={styles.ayahEnd}
                  onClick={(e) => onAyahMenu(e, ayaIndex)}
                  aria-label={`Ayah ${ayaIndex}`}
                >
                  ﴿{toArabicNumerals(ayaIndex)}﴾
                </button>
              </div>
            </div>
            <div className={styles.separator} />
          </React.Fragment>
        );
      })}

      {ayaEntries.length > 0 && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerBtnSecondary}
            onClick={nav.onPrev}
            disabled={nav.prevDisabled}
          >
            {atSurahStart ? '‹ Previous surah' : '‹ Previous'}
          </button>
          <button
            type="button"
            className={styles.pagerBtn}
            onClick={nav.onNext}
            disabled={nav.nextDisabled}
          >
            {atSurahEnd ? 'Next surah ›' : 'Continue ›'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileQuranReader;
