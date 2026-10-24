import React, { useEffect, useRef, useState } from 'react';
import { SURAHS, toArabicNumerals } from '../../constants/surahs';
import { useQuranComVerses, TRANSLATION_NAME, RECITER_NAME } from '../../services/quranComService';
import styles from './MobileQuranReader.module.css';

// Touch-first Quran reader, modelled on quran.com's translation view: one cell
// per ayah (verse key + play + menu, word-by-word Arabic, translation, hairline
// separator), big tap targets, sticky surah bar with a settings sheet and a
// bottom pager. See THIRD_PARTY_NOTICES.md.
//
// Behaviour is shared with the desktop renderer through props: tapping a word
// calls onWordTap (same as clicking a word on desktop), tapping the ayah number
// or ⋯ calls onAyahMenu (same as clicking ﴿N﴾ on desktop).
//
// Word meanings, transliteration, translation and audio come from quran.com
// (services/quranComService); roots come from the graph.

const SURAH_MAP = Object.fromEntries(SURAHS.map(s => [s.number, s]));
const BASMALA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
// Lines that can appear with each ayah. A switch only shows when the current
// page has data for it.
const ANNOTATIONS = [
  { key: 'root', label: 'Roots', defaultOn: true },
  { key: 'gloss', label: 'Word meanings', defaultOn: true },
  { key: 'translit', label: 'Transliteration', defaultOn: false },
  { key: 'translation', label: 'Translation', defaultOn: true },
];
const WORD_ANNOTATIONS = ['root', 'gloss', 'translit'];
const PAGE_SIZES = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 300, label: 'All' },
];
const SCALE_MIN = 0.8;
const SCALE_MAX = 1.8;
const prefKey = (key) => `mobileReader.show.${key}`;
const SCALE_KEY = 'mobileReader.scale';

const readPref = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === 'true';
  } catch {
    return fallback;
  }
};

const readScale = () => {
  try {
    const v = parseFloat(localStorage.getItem(SCALE_KEY));
    return v >= SCALE_MIN && v <= SCALE_MAX ? v : 1;
  } catch {
    return 1;
  }
};

const writePref = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* private mode: keep the in-memory setting only */
  }
};

const wordPosition = (item) => Number(String(item.item_id).split(':')[2]);

const MobileQuranReader = ({
  surah,
  setSurah,
  setAya,
  groupedByAya,
  nav,
  ayaCount,
  ayahsPerPage,
  setAyahsPerPage,
  loading,
  L1,
  L2,
  fontSize,
  getWordStyle,
  onWordTap,
  onAyahMenu,
}) => {
  const [shown, setShown] = useState(() =>
    Object.fromEntries(ANNOTATIONS.map((a) => [a.key, readPref(prefKey(a.key), a.defaultOn)]))
  );
  const [scale, setScale] = useState(readScale);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goToAyah, setGoToAyah] = useState('');
  const surahNumber = Number(surah);
  const meta = SURAH_MAP[surahNumber];
  const ayaEntries = Object.entries(groupedByAya);
  const firstKey = ayaEntries.length ? ayaEntries[0][0] : null;
  const verses = useQuranComVerses(surahNumber, ayaEntries.length ? nav.currentStartAya : null, nav.currentEndAya);

  // ── Recitation ──────────────────────────────────────────────────
  const audioRef = useRef(null);
  const cellRefs = useRef({});
  const continueOnNextPage = useRef(false);
  const [playing, setPlaying] = useState(null); // ayah number on this page
  const [playingWord, setPlayingWord] = useState(null);

  const play = (ayaIndex) => {
    const verse = verses?.[ayaIndex];
    const audio = audioRef.current;
    if (!verse?.audioUrl || !audio) return;
    audio.src = verse.audioUrl;
    setPlaying(Number(ayaIndex));
    setPlayingWord(null);
    const started = audio.play();
    if (started && started.catch) started.catch(() => setPlaying(null));
  };

  const stop = () => {
    audioRef.current?.pause();
    continueOnNextPage.current = false;
    setPlaying(null);
    setPlayingWord(null);
  };

  const handleEnded = () => {
    const ayat = ayaEntries.map(([n]) => Number(n));
    const next = ayat.find((n) => n > playing);
    if (next) {
      play(next);
    } else if (!nav.atSurahEnd) {
      continueOnNextPage.current = true;
      setPlaying(null);
      nav.onNext();
    } else {
      stop();
    }
  };

  const handleTimeUpdate = () => {
    const segments = verses?.[playing]?.segments || [];
    const ms = (audioRef.current?.currentTime || 0) * 1000;
    const seg = segments.find(([, , start, end]) => ms >= start && ms < end);
    setPlayingWord(seg ? seg[1] : null);
  };

  // Keep reciting across pages of the same surah
  useEffect(() => {
    if (continueOnNextPage.current && verses && firstKey !== null) {
      continueOnNextPage.current = false;
      play(firstKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses, firstKey]);

  // Follow the reciter down the page
  useEffect(() => {
    const el = playing && cellRefs.current[playing];
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [playing]);

  // Stop when the surah changes or the reader goes away
  useEffect(() => () => audioRef.current?.pause(), []);
  useEffect(() => {
    if (!continueOnNextPage.current) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNumber]);

  // New page of ayat → start reading from the top (unless the reciter is leading)
  const lastFirstKey = useRef(null);
  useEffect(() => {
    if (firstKey === null) return;
    const pageKey = `${surahNumber}:${firstKey}`;
    if (lastFirstKey.current !== null && lastFirstKey.current !== pageKey && !continueOnNextPage.current) {
      window.scrollTo({ top: 0 });
    }
    lastFirstKey.current = pageKey;
  }, [surahNumber, firstKey]);

  // ── Settings ────────────────────────────────────────────────────
  const toggle = (key) => {
    setShown({ ...shown, [key]: !shown[key] });
    writePref(prefKey(key), !shown[key]);
  };

  const changeScale = (delta) => {
    const next = Math.round(Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale + delta)) * 10) / 10;
    setScale(next);
    writePref(SCALE_KEY, next);
  };

  const submitGoTo = (e) => {
    e.preventDefault();
    const n = parseInt(goToAyah, 10);
    if (n >= 1 && n <= ayaCount) {
      setAya(n);
      setGoToAyah('');
      setSettingsOpen(false);
    }
  };

  // Word meaning: the chosen second language, else the graph's English, else quran.com
  const wordData = (item) => verses?.[item.aya_index]?.words?.[wordPosition(item)];
  const annotationText = {
    root: (item) => (item.root ? item.root.split('').join(' ') : null),
    gloss: (item) => (L2 !== 'off' && item[L2]) || item.english || wordData(item)?.gloss || null,
    translit: (item) => item.transliteration || wordData(item)?.translit || null,
  };
  const allItems = ayaEntries.flatMap(([, ayaItems]) => ayaItems);
  const hasTranslation = ayaEntries.some(([n]) => verses?.[n]?.translation);
  const available = ANNOTATIONS.filter((a) =>
    a.key === 'translation' ? hasTranslation : allItems.some((item) => annotationText[a.key](item))
  );
  const wordLines = available.filter((a) => WORD_ANNOTATIONS.includes(a.key) && shown[a.key]);
  const showTranslation = hasTranslation && shown.translation;
  const hasAudio = ayaEntries.some(([n]) => verses?.[n]?.audioUrl);

  const num = (n) => (L1 === 'sem' ? toArabicNumerals(n) : n);

  return (
    <div className={styles.reader} style={{ '--qr-scale': ((fontSize || 16) / 16) * scale }}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} onEnded={handleEnded} onTimeUpdate={handleTimeUpdate} preload="none" />

      <div className={styles.bar}>
        <div className={styles.barRow}>
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
          {hasAudio && (
            <button
              type="button"
              className={`${styles.iconBtn} ${playing ? styles.iconBtnActive : ''}`}
              onClick={() => (playing ? stop() : play(firstKey))}
              aria-label={playing ? 'Stop recitation' : 'Play recitation'}
            >
              {playing ? '■' : '▶'}
            </button>
          )}
          <button
            type="button"
            className={`${styles.iconBtn} ${settingsOpen ? styles.iconBtnActive : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-expanded={settingsOpen}
            aria-label="Reader settings"
          >
            Aa
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

        {settingsOpen && (
          <div className={styles.sheet} role="group" aria-label="Reader settings">
            <div className={styles.sheetRow}>
              <span className={styles.sheetLabel}>Ayat per page</span>
              <div className={styles.segmented}>
                {PAGE_SIZES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`${styles.segment} ${ayahsPerPage === p.value ? styles.segmentActive : ''}`}
                    aria-pressed={ayahsPerPage === p.value}
                    onClick={() => setAyahsPerPage(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sheetRow}>
              <span className={styles.sheetLabel}>Text size</span>
              <div className={styles.segmented}>
                <button
                  type="button"
                  className={styles.segment}
                  onClick={() => changeScale(-0.1)}
                  disabled={scale <= SCALE_MIN}
                  aria-label="Smaller text"
                >
                  A−
                </button>
                <span className={styles.scaleValue}>{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  className={styles.segment}
                  onClick={() => changeScale(0.1)}
                  disabled={scale >= SCALE_MAX}
                  aria-label="Larger text"
                >
                  A+
                </button>
              </div>
            </div>

            {available.map((a) => (
              <div key={a.key} className={styles.sheetRow}>
                <span className={styles.sheetLabel}>{a.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={shown[a.key]}
                  aria-label={a.label}
                  className={`${styles.switch} ${shown[a.key] ? styles.switchOn : ''}`}
                  onClick={() => toggle(a.key)}
                >
                  <span className={styles.switchKnob} />
                </button>
              </div>
            ))}

            <form className={styles.sheetRow} onSubmit={submitGoTo}>
              <label className={styles.sheetLabel} htmlFor="mqr-goto">
                Go to ayah
              </label>
              <div className={styles.segmented}>
                <input
                  id="mqr-goto"
                  className={styles.goToInput}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={ayaCount}
                  placeholder={`1–${ayaCount}`}
                  value={goToAyah}
                  onChange={(e) => setGoToAyah(e.target.value)}
                />
                <button type="submit" className={styles.segment}>
                  Go
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className={styles.chapterHeader}>
        <div className={styles.chapterNameArabic}>{meta ? meta.arabic : surahNumber}</div>
        <div className={styles.chapterNameLatin}>
          {surahNumber}. {meta ? meta.english : `Surah ${surahNumber}`}
        </div>
        {ayaEntries.length > 0 && (
          <div className={styles.range}>
            Ayat {nav.currentStartAya}
            {nav.currentEndAya !== nav.currentStartAya ? `–${nav.currentEndAya}` : ''} of {ayaCount}
          </div>
        )}
      </div>

      {/* Al-Fatiha's basmala is its own ayah 1; at-Tawba has none */}
      {surahNumber !== 1 && surahNumber !== 9 && nav.atSurahStart && <div className={styles.basmala}>{BASMALA}</div>}

      <div className={loading ? styles.pageLoading : undefined} aria-busy={loading || undefined}>
        {ayaEntries.map(([ayaIndex, ayaItems]) => {
          const isAyaHighlighted = ayaItems.every((item) => item.isFreeformHighlighted);
          const isPlaying = playing === Number(ayaIndex);
          const verse = verses?.[ayaIndex];
          return (
            <React.Fragment key={ayaIndex}>
              {/* backgroundColor is user-supplied at runtime — must stay inline */}
              <div
                ref={(el) => {
                  cellRefs.current[ayaIndex] = el;
                }}
                className={`${styles.cell} ${isPlaying ? styles.cellPlaying : ''}`}
                style={isAyaHighlighted ? { backgroundColor: ayaItems[0].highlightColor } : undefined}
                data-ayah={`${surahNumber}:${ayaIndex}`}
              >
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.verseKey}
                    onClick={(e) => onAyahMenu(e, ayaIndex)}
                  >
                    {surahNumber}:{ayaIndex}
                  </button>
                  <div className={styles.actionsEnd}>
                    {verse?.audioUrl && (
                      <button
                        type="button"
                        className={styles.menuBtn}
                        onClick={() => (isPlaying ? stop() : play(ayaIndex))}
                        aria-label={`${isPlaying ? 'Stop' : 'Play'} ayah ${surahNumber}:${ayaIndex}`}
                      >
                        {isPlaying ? '■' : '▶'}
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.menuBtn}
                      onClick={(e) => onAyahMenu(e, ayaIndex)}
                      aria-label={`Ayah ${surahNumber}:${ayaIndex} options`}
                    >
                      ⋯
                    </button>
                  </div>
                </div>

                <div className={styles.verseText} translate="no">
                  {ayaItems.map((item) => {
                    const lines = wordLines
                      .map((a) => [a.key, annotationText[a.key](item)])
                      .filter(([, text]) => text);
                    const isReciting = isPlaying && playingWord === wordPosition(item);
                    return (
                      <span
                        key={item.item_id}
                        role="button"
                        tabIndex={0}
                        className={`${styles.word} ${isReciting ? styles.wordReciting : ''}`}
                        style={getWordStyle(item)}
                        onClick={() => onWordTap(item)}
                        onKeyDown={(e) => e.key === 'Enter' && onWordTap(item)}
                      >
                        <span className={styles.arabic} lang="ar">
                          {item[L1] || item.arabic}
                        </span>
                        {lines.map(([key, text]) => (
                          <span key={key} className={styles[key]}>
                            {text}
                          </span>
                        ))}
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

                {showTranslation && verse?.translation && (
                  <p className={styles.translation} lang="en">
                    {verse.translation}
                  </p>
                )}
              </div>
              <div className={styles.separator} />
            </React.Fragment>
          );
        })}
      </div>

      {ayaEntries.length > 0 && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerBtnSecondary}
            onClick={nav.onPrev}
            disabled={nav.prevDisabled || loading}
          >
            {nav.atSurahStart ? '‹ Previous surah' : '‹ Previous'}
          </button>
          <button
            type="button"
            className={styles.pagerBtn}
            onClick={nav.onNext}
            disabled={nav.nextDisabled || loading}
          >
            {loading ? 'Loading…' : nav.atSurahEnd ? 'Next surah ›' : 'Continue ›'}
          </button>
        </div>
      )}

      {(showTranslation || hasAudio || wordLines.some((a) => a.key !== 'root')) && (
        <p className={styles.credits}>
          Translation: {TRANSLATION_NAME}. Recitation: {RECITER_NAME}. Word-by-word data via quran.com.
        </p>
      )}
    </div>
  );
};

export default MobileQuranReader;
