// "Find the root": a random Quran word, the player names its root.
// Built only on existing endpoints (random words, ayah range, root words),
// so it works against the prod backend that staging uses.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRandomNodes, fetchQuranItemsRange, fetchRootWords } from '../../services/apiService';
import { SURAHS } from '../../constants/surahs';
import { useLabels } from '../../hooks/useLabels';
import {
  RADICALS, MAX_HINTS, checkRoot, formatRoot, rootLetters, wordSegments, isPlayable, points, pickChoices,
  glossFor, relatedWords, normalizeLetter, cleanArabic,
} from './rootGameLogic';

const ROUND_LENGTH = 10;
const QURAN = 2;
const HINTS = ['gloss', 'stem', 'first', 'related'];
const BEST_KEY = 'rootGameBest';

const readBest = () => {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
};
const writeBest = (n) => {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* private mode */ }
};

const newRound = () => ({ number: 0, score: 0, streak: 0, history: [] });

const RootGame = () => {
  const t = useLabels();
  const [surah, setSurah] = useState(0); // 0 = whole Quran
  const [mode, setMode] = useState('type');
  const [round, setRound] = useState(newRound);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [best, setBest] = useState(readBest);

  // Fetched but not yet played words, roots seen (for distractors), ids played
  const queue = useRef([]);
  const rootPool = useRef(new Set());
  const played = useRef(new Set());

  const nextItem = useCallback(async () => {
    const filters = { corpus_id: QURAN, ...(surah ? { surah_numbers: [surah] } : {}) };
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!queue.current.length) {
        const data = await fetchRandomNodes('word', 8, filters);
        const fresh = (data.nodes || []).filter(isPlayable);
        fresh.forEach((n) => rootPool.current.add(formatRoot(n.root)));
        // After a few tries in a short surah, allow repeats
        queue.current = attempt < 2 ? fresh.filter((n) => !played.current.has(n.item_id)) : fresh;
      }
      const item = queue.current.shift();
      if (item) return item;
    }
    return null;
  }, [surah]);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const item = await nextItem();
      if (!item) {
        setQuestion(null);
        setError(t.gameNoWords);
        return;
      }
      played.current.add(item.item_id);
      let choices = null;
      if (mode === 'choose') {
        if (rootPool.current.size < 8) {
          const data = await fetchRandomNodes('root', 8, {});
          (data.nodes || []).forEach((r) => r.arabic && rootPool.current.add(formatRoot(r.arabic)));
        }
        choices = pickChoices(item.root, [...rootPool.current]);
      }
      setQuestion({
        item,
        letters: rootLetters(item.root),
        segments: wordSegments(item),
        choices,
        picked: null,
        guess: [],
        locked: 0, // slots filled by the "first letter" hint
        hints: [],
        words: null, // Words under the root, fetched for the gloss / related hints
        ayah: null,
        result: null,
      });
      fetchQuranItemsRange(QURAN, item.surah_number, item.ayah_number, item.ayah_number)
        .then((ayah) => setQuestion((q) => (q && q.item.item_id === item.item_id ? { ...q, ayah } : q)))
        .catch(() => {});
    } catch (e) {
      console.error('Root game: failed to load a word', e);
      setError(t.gameLoadError);
    } finally {
      setLoading(false);
    }
  }, [mode, nextItem, t]);

  // A new round whenever the scope or mode changes
  useEffect(() => {
    queue.current = [];
    played.current = new Set();
    setRound(newRound());
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah, mode]);

  useEffect(() => {
    if (round.number === ROUND_LENGTH && round.score > best) {
      setBest(round.score);
      writeBest(round.score);
    }
  }, [round, best]);

  const finish = (result, picked = null) => {
    const gained = result === 'wrong' || result === 'gaveUp' ? 0 : points(mode, question.hints.length);
    setQuestion((q) => ({ ...q, result, picked }));
    setRound((r) => ({
      ...r,
      number: r.number + 1,
      score: r.score + gained,
      streak: gained ? r.streak + 1 : 0,
      history: [...r.history, { word: cleanArabic(question.item.sem), root: formatRoot(question.item.root), ref: question.item.item_id, gained }],
    }));
  };

  const takeHint = async (hint) => {
    if (!question || question.result || question.hints.includes(hint)) return;
    const q = { ...question, hints: [...question.hints, hint] };
    if (hint === 'first' && mode === 'type') {
      q.guess = [q.letters[0], ...q.guess.slice(1)];
      q.locked = 1;
    }
    setQuestion(q);
    if ((hint === 'gloss' || hint === 'related') && !q.words) {
      const [r1, r2, r3] = q.letters;
      const words = await fetchRootWords(r1, r2, r3).then((d) => d.words || []).catch(() => []);
      setQuestion((cur) => (cur && cur.item.item_id === q.item.item_id ? { ...cur, words } : cur));
    }
  };

  const typeLetter = useCallback((ch) => {
    setQuestion((q) => {
      if (!q || q.result || q.guess.length >= q.letters.length) return q;
      return { ...q, guess: [...q.guess, normalizeLetter(ch)] };
    });
  }, []);

  const backspace = useCallback(() => {
    setQuestion((q) => (q && !q.result && q.guess.length > q.locked ? { ...q, guess: q.guess.slice(0, -1) } : q));
  }, []);

  const clearSlot = (i) => {
    if (question.result || i < question.locked) return;
    setQuestion((q) => ({ ...q, guess: q.guess.slice(0, i) }));
  };

  const check = () => {
    if (!question || question.result || question.guess.length !== question.letters.length) return;
    finish(checkRoot(question.guess, question.item.root));
  };

  const choose = (option) => {
    if (question.result) return;
    finish(checkRoot(option.split('-'), question.item.root), option);
  };

  const next = () => {
    if (round.number >= ROUND_LENGTH) setRound(newRound());
    loadQuestion();
  };

  // Physical keyboard: Arabic letters, Backspace, Enter
  const keys = useRef({});
  keys.current = { check, next, done: Boolean(question?.result) };
  useEffect(() => {
    if (mode !== 'type') return undefined;
    const onKey = (e) => {
      if (['SELECT', 'INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const ch = normalizeLetter(e.key);
      if (RADICALS.includes(ch)) typeLetter(ch);
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (keys.current.done) keys.current.next();
        else keys.current.check();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, typeLetter, backspace]);

  const roundOver = round.number >= ROUND_LENGTH && Boolean(question?.result);
  const answer = question ? formatRoot(question.item.root) : '';
  const scored = question?.result === 'exact' || question?.result === 'weak';
  const gloss = question?.words ? glossFor(question.words, question.item.lemma) : null;
  const related = question?.words ? relatedWords(question.words, question.item.lemma) : null;

  const pill = (active) =>
    `py-1.5 px-3 text-dynamic-sm rounded-md border ${
      active ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-border hover:bg-surface-alt'
    }`;
  const quiet = 'py-2 px-4 rounded-md bg-neutral hover:bg-neutral-hover';

  return (
    <div className="max-w-[640px] mx-auto px-4 pb-10">
      <h2 className="mb-1">{t.gameRootTitle}</h2>
      <p className="text-muted text-dynamic-sm mb-4">{t.gameRootIntro}</p>

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={surah}
          onChange={(e) => setSurah(Number(e.target.value))}
          className="border border-border rounded-md py-1.5 px-2 bg-white text-ink max-w-full"
          aria-label={t.surahLabel}
        >
          <option value={0}>{t.gameAllQuran}</option>
          {SURAHS.map((s) => (
            <option key={s.number} value={s.number}>{s.number}. {s.english} · {s.arabic}</option>
          ))}
        </select>
        <div className="flex gap-1" role="group">
          <button className={pill(mode === 'type')} onClick={() => setMode('type')}>{t.gameModeType}</button>
          <button className={pill(mode === 'choose')} onClick={() => setMode('choose')}>{t.gameModeChoose}</button>
        </div>
      </div>

      {/* Score bar */}
      <div className="flex justify-between text-dynamic-sm text-muted mb-3">
        <span>{t.gameQuestion(Math.min(round.number + (question?.result ? 0 : 1), ROUND_LENGTH), ROUND_LENGTH)}</span>
        <span>{t.gameScore}: <strong className="text-ink">{round.score}</strong></span>
        <span>{t.gameStreak}: <strong className="text-ink">{round.streak}</strong></span>
      </div>

      {error && <p className="text-danger">{error}</p>}
      {loading && !question && <p className="text-muted">{t.gameLoading}</p>}

      {question && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          {/* The word */}
          <div className="text-center bg-surface rounded-xl py-6 px-4 mb-3">
            <div className="arabic" dir="rtl" style={{ fontSize: 'calc(var(--arabic-lg) * 1.6)' }} data-testid="game-word">
              {question.segments.map((s, i) => (
                <span key={i} className={question.hints.includes('stem') && s.kind !== 'stem' ? 'opacity-25' : ''}>
                  {s.arabic}
                </span>
              ))}
            </div>
            <div className="text-dynamic-xs text-muted mt-1">
              {question.item.item_id}
              {question.letters.length === 4 && ` · ${t.gameFourLetters}`}
            </div>
          </div>

          {/* The ayah, with the word in bold */}
          {question.ayah && (
            <p className="arabic small text-center text-muted mb-4" dir="rtl">
              {question.ayah.map((w) => (
                <span key={w.item_id} className={w.item_id === question.item.item_id ? 'text-ink font-bold' : ''}>
                  {cleanArabic(w.arabic)}{' '}
                </span>
              ))}
            </p>
          )}

          {/* Hints */}
          {!question.result && (
            <div className="mb-3">
              <div className="text-dynamic-xs text-muted mb-1">{t.gameHintsLeft(MAX_HINTS - question.hints.length)}</div>
              <div className="flex flex-wrap gap-2">
                {HINTS.filter((h) => !(h === 'related' && question.letters.length === 4)).map((h) => (
                  <button
                    key={h}
                    disabled={question.hints.includes(h)}
                    onClick={() => takeHint(h)}
                    className="py-1 px-3 text-dynamic-sm rounded-md bg-white text-ink border border-border hover:bg-surface-alt disabled:opacity-40"
                  >
                    {t[`gameHint_${h}`]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="text-dynamic-sm mb-4 space-y-1">
            {question.hints.includes('gloss') && (
              <div>{t.gameMeaning}: <em>{question.words ? gloss || t.gameNoHint : '…'}</em></div>
            )}
            {question.hints.includes('first') && mode === 'choose' && (
              <div>{t.gameFirstLetter}: <span className="arabic">{question.letters[0]}</span></div>
            )}
            {question.hints.includes('related') && (
              <div>
                {t.gameRelated}:{' '}
                {!question.words ? '…' : related.length ? related.map((w) => (
                  <span key={w.word_id} className="me-3 inline-block">
                    <span className="arabic">{w.arabic}</span>{w.english && ` (${w.english})`}
                  </span>
                )) : t.gameNoHint}
              </div>
            )}
          </div>

          {/* Answer */}
          {mode === 'type' ? (
            <>
              <div className="flex justify-center gap-2 mb-4" dir="rtl">
                {question.letters.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => clearSlot(i)}
                    className={`w-14 h-14 rounded-lg border-2 border-border-dark arabic text-[28px] p-0 flex items-center justify-center text-ink ${
                      i < question.locked ? 'bg-surface-dark hover:bg-surface-dark' : 'bg-white hover:bg-surface-alt'
                    }`}
                    aria-label={t.gameSlot(i + 1)}
                  >
                    {question.guess[i] || ''}
                  </button>
                ))}
              </div>
              {!question.result && (
                <>
                  <div className="grid grid-cols-7 gap-1.5 mb-3" dir="rtl">
                    {RADICALS.map((ch) => (
                      <button
                        key={ch}
                        onClick={() => typeLetter(ch)}
                        className="h-11 p-0 rounded-md bg-surface text-ink border border-border-light hover:bg-surface-alt arabic text-[22px]"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button onClick={backspace} className={quiet} aria-label={t.gameDelete}>⌫</button>
                    <button
                      onClick={check}
                      disabled={question.guess.length !== question.letters.length}
                      className="py-2 px-6 rounded-md disabled:opacity-40"
                    >
                      {t.gameCheck}
                    </button>
                    <button onClick={() => finish('gaveUp')} className={quiet}>{t.gameGiveUp}</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {question.choices.map((c) => {
                const isAnswer = c === answer;
                const shown = question.result && (isAnswer || c === question.picked);
                return (
                  <button
                    key={c}
                    onClick={() => choose(c)}
                    dir="rtl"
                    className={`h-14 rounded-lg arabic text-[24px] p-0 border-2 ${
                      shown
                        ? isAnswer ? 'bg-success hover:bg-success text-white border-success' : 'bg-danger hover:bg-danger text-white border-danger'
                        : 'bg-white text-ink border-border hover:bg-surface-alt'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback */}
          {question.result && (
            <div className="text-center mt-4">
              <p className={`font-semibold mb-1 ${scored ? 'text-success' : 'text-danger'}`}>
                {question.result === 'exact' ? t.gameCorrect : question.result === 'weak' ? t.gameClose : t.gameWrong}
              </p>
              <p className="mb-3">
                {t.gameRootIs} <span className="arabic large font-bold" dir="rtl">{answer}</span>
                {scored && <span className="text-muted text-dynamic-sm"> (+{points(mode, question.hints.length)})</span>}
              </p>
              {!roundOver && <button onClick={next} className="py-2 px-6 rounded-md">{t.gameNext}</button>}
            </div>
          )}

          {/* Round summary */}
          {roundOver && (
            <div className="mt-6 p-4 rounded-xl border border-border-light">
              <h3 className="mb-2">{t.gameRoundOver}</h3>
              <p className="mb-2">
                {t.gameScore}: <strong>{round.score}</strong> / {ROUND_LENGTH * points(mode, 0)} · {t.gameBest}: {best}
              </p>
              <ul className="mb-4 p-0 list-none">
                {round.history.map((h, i) => (
                  <li key={i} className="my-1 cursor-default grid grid-cols-4 gap-2 items-center text-dynamic-sm">
                    <span className="arabic" dir="rtl">{h.word}</span>
                    <span className="arabic" dir="rtl">{h.root}</span>
                    <span className="text-muted">{h.ref}</span>
                    <span className={`text-end ${h.gained ? 'text-success' : 'text-danger'}`}>+{h.gained}</span>
                  </li>
                ))}
              </ul>
              <button onClick={next} className="py-2 px-6 rounded-md">{t.gamePlayAgain}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RootGame;
