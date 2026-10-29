// "Find the root": a random word, the player names its root.
// Words come from the whole lexicon, the whole Quran, or one surah, at one of
// three levels (see LEVELS in rootGameLogic). Built only on existing
// endpoints, so it runs on the prod backend that staging uses. That API is
// rate-limited (30 requests/min), so each question costs about one request:
// lexicon questions expand a random Root by id, and that one word list (with
// each Word's Lane entry and verb form) answers the meaning and related-words
// hints. Quran words look their root up by letters on the lean root-words
// endpoint (it matches on r1-r3), and fetch a Word's Lane entry only when its
// meaning is asked for.
//
// Once answered, the word and its related words open the app's word menu
// (Lane and Hans Wehr entries, expand, inspect), plus "View graph": the
// word's minimal graph (the word and its root, and its form in advanced mode).
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRandomNodes, fetchQuranItemsRange, fetchRootWords, expandGraph } from '../../services/apiService';
import { SURAHS } from '../../constants/surahs';
import { useLabels } from '../../hooks/useLabels';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdvancedMode } from '../../contexts/AdvancedModeContext';
import { useGraphData, normalizeNodes } from '../../contexts/GraphDataContext';
import GraphVisualization from '../graph/GraphVisualization';
import NodeContextMenu from '../graph/NodeContextMenu';
import NodeInspector from '../graph/NodeInspector';
import InfoBubble from '../layout/InfoBubble';
import {
  RADICALS, MAX_HINTS, LEVELS, checkRoot, formatRoot, rootLetters, wordSegments, isPlayable,
  itemFitsLevel, rootFitsLevel, lexiconCandidates, points, pickChoices, pickRandom, lemmaWord, laneGloss, relatedWords,
  normalizeLetter, cleanArabic,
} from './rootGameLogic';

const ROUND_LENGTH = 10;
const QURAN = 2;
const QURAN_BATCH = 30;
const HINTS = ['gloss', 'stem', 'first', 'related'];
const BEST_KEY = 'rootGameBest';
const SETTINGS_KEY = 'rootGameSettings';
const DEFAULTS = { source: 'lexicon', level: 'beginner', mode: 'type' };

const readStored = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const writeStored = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
};

const newRound = () => ({ number: 0, score: 0, streak: 0, history: [] });

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const LEXICON_OPTIONS = { L1: 'sem', L2: 'english', limit: 100 };

const RootGame = () => {
  const t = useLabels();
  const { L1, L2 } = useLanguage();
  const { isAdvancedMode } = useAdvancedMode();
  const {
    graphData, setGraphData, handleNodeClick, handleContextMenuAction,
    infoBubble, setInfoBubble, nodeInspectorData, setNodeInspectorData, handleNodeNavigation,
  } = useGraphData();
  const ar = L1 === 'arabic';
  const num = (n) => (ar ? String(n).replace(/\d/g, (d) => ARABIC_DIGITS[d]) : String(n));
  // source: 'lexicon' | 'quran' | a surah number
  const [settings, setSettings] = useState(() => ({ ...DEFAULTS, ...readStored(SETTINGS_KEY, {}) }));
  const { source, level, mode } = settings;
  const [round, setRound] = useState(newRound);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [best, setBest] = useState(() => Number(readStored(BEST_KEY, 0)) || 0);
  const [menu, setMenu] = useState(null); // { node, position }: the word menu
  const [graphOpen, setGraphOpen] = useState(false);
  const graphRef = useRef(null);

  const queue = useRef([]); // Quran: fetched items; lexicon: fetched Roots
  const rootPool = useRef(new Set()); // roots seen, for multiple-choice distractors
  const played = useRef(new Set());
  const rootWords = useRef(new Map()); // root -> its Words, so hints don't refetch
  const wordNodes = useRef(new Map()); // word_id -> full Word node (or null)

  const update = (patch) => setSettings((s) => {
    const next = { ...s, ...patch };
    writeStored(SETTINGS_KEY, next);
    return next;
  });

  const wordsFor = useCallback(async (root, rootId) => {
    const key = formatRoot(root);
    if (!rootWords.current.has(key)) {
      // As stored (r2/r3 can be أ or ى), not normalized
      const letters = [...root.replace(/[-\s]/g, '')];
      let words = [];
      if (rootId) {
        const data = await expandGraph('root', rootId, 'word', LEXICON_OPTIONS).catch(() => ({ nodes: [] }));
        words = (data.nodes || [])
          .filter((n) => n.node_type === 'Word' && n.arabic)
          .map((n) => ({ ...n, definitions: n.definitions || null }));
      } else if (letters.length === 3) {
        const data = await fetchRootWords(...letters).catch(() => ({ words: [] }));
        words = data.words || [];
      }
      rootWords.current.set(key, words);
    }
    return rootWords.current.get(key);
  }, []);

  // A Word's full node, with its Lane (definitions) and Hans Wehr entries.
  // root-words lists Words without them, so those are fetched one at a time.
  const nodeOf = useCallback(async (word) => {
    if (!word) return null;
    if (word.definitions !== undefined) return word;
    if (!wordNodes.current.has(word.word_id)) {
      const data = await expandGraph('word', word.word_id, 'root', { L1: 'sem', L2: 'english' }).catch(() => ({ nodes: [] }));
      wordNodes.current.set(word.word_id,
        (data.nodes || []).find((n) => n.node_type === 'Word' && Number(n.word_id) === Number(word.word_id)) || null);
    }
    return wordNodes.current.get(word.word_id);
  }, []);

  const meaningOf = useCallback(async (word) => laneGloss((await nodeOf(word))?.definitions), [nodeOf]);

  const nextQuranItem = useCallback(async () => {
    const filters = { corpus_id: QURAN, ...(source !== 'quran' ? { surah_numbers: [source] } : {}) };
    for (let attempt = 0; attempt < 5; attempt++) {
      if (!queue.current.length) {
        // Beginner keeps only ~6% of Quran words (Form I verbs, sound roots)
        const data = await fetchRandomNodes('word', QURAN_BATCH, filters);
        const fresh = (data.nodes || []).filter(isPlayable);
        fresh.forEach((n) => rootPool.current.add(formatRoot(n.root)));
        // After a few tries in a short surah, allow repeats
        queue.current = fresh
          .filter((n) => itemFitsLevel(n, level))
          .filter((n) => attempt >= 3 || !played.current.has(n.item_id));
      }
      const item = queue.current.shift();
      if (item) return { item, words: null };
    }
    return null;
  }, [source, level]);

  const nextLexiconItem = useCallback(async () => {
    for (let calls = 0; calls < 4; calls++) {
      if (!queue.current.length) {
        const data = await fetchRandomNodes('root', 12, {});
        const roots = (data.nodes || [])
          .filter((r) => r.arabic)
          .map((r) => ({ root: r.arabic.replace(/-/g, ''), id: r.root_id }));
        roots.forEach((r) => rootPool.current.add(formatRoot(r.root)));
        queue.current = roots.filter((r) => rootFitsLevel(r.root, level));
        continue;
      }
      const { root, id } = queue.current.shift();
      const words = await wordsFor(root, id);
      const candidates = lexiconCandidates(root, words, level).filter((w) => !played.current.has(`word:${w.word_id}`));
      if (candidates.length) {
        const w = pickRandom(candidates);
        return {
          item: { item_id: `word:${w.word_id}`, sem: w.arabic, lemma: w.arabic, root, root_id: id, word_type: w.word_type, word: w },
          words,
        };
      }
    }
    return null;
  }, [level, wordsFor]);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMenu(null);
    setGraphOpen(false);
    try {
      const next = source === 'lexicon' ? await nextLexiconItem() : await nextQuranItem();
      if (!next) {
        setQuestion(null);
        setError(t.gameNoWords);
        return;
      }
      const { item, words } = next;
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
        quran: source !== 'lexicon',
        choices,
        picked: null,
        guess: [],
        locked: 0, // slots filled by the "first letter" hint
        hints: [],
        words, // Words under the root, for the meaning / related hints
        node: null, // the full Word node, for the word menu
        meaning: undefined, // Lane excerpt: undefined until fetched, null if none
        related: {}, // word_id -> meaning of a related word the player opened
        ayah: null,
        result: null,
      });
      if (item.surah_number) {
        fetchQuranItemsRange(QURAN, item.surah_number, item.ayah_number, item.ayah_number)
          .then((ayah) => setQuestion((q) => (q && q.item.item_id === item.item_id ? { ...q, ayah } : q)))
          .catch(() => {});
      }
    } catch (e) {
      console.error('Root game: failed to load a word', e);
      setError(t.gameLoadError);
    } finally {
      setLoading(false);
    }
  }, [source, mode, nextLexiconItem, nextQuranItem, t]);

  // A new round whenever the settings change
  useEffect(() => {
    queue.current = [];
    played.current = new Set();
    setRound(newRound());
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, level, mode]);

  useEffect(() => {
    if (round.number === ROUND_LENGTH && round.score > best) {
      setBest(round.score);
      writeStored(BEST_KEY, round.score);
    }
  }, [round, best]);

  // The question's Word, for the meaning hint and the menu after answering
  const loadWord = async (q) => {
    if (q.meaning !== undefined) return;
    const words = q.words || await wordsFor(q.item.root, q.item.root_id);
    const node = await nodeOf(q.item.word || lemmaWord(words, q.item.lemma));
    const meaning = laneGloss(node?.definitions);
    setQuestion((cur) => (cur && cur.item.item_id === q.item.item_id ? { ...cur, words, node, meaning } : cur));
  };

  // The app's word menu, opened where the player tapped
  const openMenu = async (word, e) => {
    const position = { x: e.clientX, y: e.clientY };
    const node = await nodeOf(word);
    if (node) setMenu({ node: normalizeNodes([node])[0], position });
  };

  // The minimal graph: the word and its root, and its form in advanced mode
  const showGraph = async (node) => {
    setGraphOpen(true);
    const parts = await Promise.all(['root', ...(isAdvancedMode ? ['form'] : [])]
      .map((to) => expandGraph('word', node.word_id, to, { L1, L2 }).catch(() => null)));
    const nodes = new Map();
    const links = [];
    parts.filter(Boolean).forEach((part) => {
      (part.nodes || []).forEach((n) => nodes.set(n.id, n));
      links.push(...(part.links || []));
    });
    setGraphData({ nodes: normalizeNodes([...nodes.values()]), links });
  };

  const menuAction = (action, node) => {
    if (action === 'view-graph') {
      showGraph(node);
      return;
    }
    handleContextMenuAction(action, node, menu?.position);
    if (action.startsWith('expand')) setGraphOpen(true);
  };

  useEffect(() => {
    if (graphOpen) graphRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, [graphOpen]);

  const showRelated = async (word) => {
    const id = question.item.item_id;
    if (word.word_id in question.related) {
      setQuestion((q) => {
        const related = { ...q.related };
        delete related[word.word_id];
        return { ...q, related };
      });
      return;
    }
    setQuestion((q) => ({ ...q, related: { ...q.related, [word.word_id]: undefined } }));
    const meaning = await meaningOf(word);
    setQuestion((cur) => (cur && cur.item.item_id === id ? { ...cur, related: { ...cur.related, [word.word_id]: meaning } } : cur));
  };

  const finish = (result, picked = null) => {
    loadWord(question);
    const gained = result === 'wrong' || result === 'gaveUp' ? 0 : points(mode, question.hints.length);
    setQuestion((q) => ({ ...q, result, picked }));
    setRound((r) => ({
      ...r,
      number: r.number + 1,
      score: r.score + gained,
      streak: gained ? r.streak + 1 : 0,
      history: [...r.history, {
        word: cleanArabic(question.item.sem), root: formatRoot(question.item.root), ref: question.quran ? question.item.item_id : '', gained,
      }],
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
    if (hint === 'gloss') loadWord(q);
    else if (hint === 'related' && !q.words) {
      const words = await wordsFor(q.item.root, q.item.root_id);
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
  const related = question?.words ? relatedWords(question.words, question.item.lemma) : null;
  const tappable = Boolean(question?.result && question.node);
  const hints = question
    // Quran words look their root up by r1-r3, which can't list a longer root's words
    ? HINTS.filter((h) => !(h === 'related' && question.quran && question.letters.length > 3) && !(h === 'stem' && !question.quran))
    : [];

  // No Tailwind preflight here: the global button rule sets border-style none,
  // so bordered buttons need border-solid as well as a width.
  const pill = (active) =>
    `py-1.5 px-3 text-dynamic-sm rounded-md border border-solid ${
      active ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-border hover:bg-surface-alt'
    }`;
  const quiet = 'py-2 px-4 rounded-md bg-neutral hover:bg-neutral-hover';

  return (
    <div className="max-w-[640px] lg:max-w-[1040px] mx-auto pb-28" dir={ar ? 'rtl' : 'ltr'}>
      <h2 className="mb-1">{t.gameRootTitle}</h2>
      <p className="text-muted text-dynamic-sm mb-3">{t.gameRootIntro}</p>

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <select
          value={String(source)}
          onChange={(e) => update({ source: ['lexicon', 'quran'].includes(e.target.value) ? e.target.value : Number(e.target.value) })}
          className="border border-border rounded-md py-1.5 px-2 bg-white text-ink max-w-full"
          aria-label={t.gameSource}
        >
          <option value="lexicon">{t.gameLexicon}</option>
          <option value="quran">{t.gameAllQuran}</option>
          <optgroup label={t.surahLabel}>
            {SURAHS.map((s) => (
              <option key={s.number} value={s.number}>{num(s.number)}. {ar ? s.arabic : `${s.english} · ${s.arabic}`}</option>
            ))}
          </optgroup>
        </select>
        <div className="flex gap-1" role="group" aria-label={t.gameLevel}>
          {LEVELS.map((l) => (
            <button key={l} className={pill(level === l)} onClick={() => update({ level: l })}>{t[`gameLevel_${l}`]}</button>
          ))}
        </div>
        <div className="flex gap-1" role="group" aria-label={t.gameAnswerMode}>
          <button className={pill(mode === 'type')} onClick={() => update({ mode: 'type' })}>{t.gameModeType}</button>
          <button className={pill(mode === 'choose')} onClick={() => update({ mode: 'choose' })}>{t.gameModeChoose}</button>
        </div>
      </div>
      <p className="text-dynamic-xs text-muted mb-4">{t[`gameLevelNote_${level}`]}</p>

      {/* Score bar */}
      <div className="flex justify-between text-dynamic-sm text-muted mb-3">
        <span>{t.gameQuestion(num(Math.min(round.number + (question?.result ? 0 : 1), ROUND_LENGTH)), num(ROUND_LENGTH))}</span>
        <span>{t.gameScore}: <strong className="text-ink">{num(round.score)}</strong></span>
        <span>{t.gameStreak}: <strong className="text-ink">{num(round.streak)}</strong></span>
      </div>

      {error && (
        <p className="text-danger">
          {error}{' '}
          <button onClick={loadQuestion} className="py-1 px-3 ms-2 rounded-md text-dynamic-sm">{t.gameTryAgain}</button>
        </p>
      )}
      {loading && !question && <p className="text-muted">{t.gameLoading}</p>}

      {question && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          {/* Desktop: the word and hints beside the answer */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          <div>
          {/* The word */}
          <div className="text-center bg-surface rounded-xl py-6 px-4 mb-3">
            <div className="text-dynamic-sm font-semibold text-ink mb-2">{t.gamePrompt}</div>
            <div
              className={`arabic ${tappable ? 'cursor-pointer hover:underline' : ''}`}
              dir="rtl"
              style={{ fontSize: 'calc(var(--arabic-lg) * 1.6)' }}
              data-testid="game-word"
              {...(tappable ? {
                role: 'button',
                tabIndex: 0,
                title: t.gameTapWord,
                onClick: (e) => openMenu(question.node, e),
              } : {})}
            >
              {question.segments.map((s, i) => (
                <span key={i} className={question.hints.includes('stem') && s.kind !== 'stem' ? 'opacity-25' : ''}>
                  {s.arabic}
                </span>
              ))}
            </div>
            <div className="text-dynamic-xs text-muted mt-1">
              {question.quran ? num(question.item.item_id) : t[`gameWordType_${question.item.word_type}`]}
              {question.letters.length > 3 && ` · ${t.gameLongRoot(question.letters.length)}`}
            </div>
            {tappable && <div className="text-dynamic-xs text-muted mt-1">{t.gameTapWord}</div>}
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
              <div className="text-dynamic-xs text-muted mb-1">{t.gameHintsLeft(hints.length - question.hints.length)}</div>
              <div className="flex flex-wrap gap-2">
                {hints.map((h) => (
                  <button
                    key={h}
                    disabled={question.hints.includes(h) || question.hints.length >= MAX_HINTS}
                    onClick={() => takeHint(h)}
                    className="py-1 px-3 text-dynamic-sm rounded-md bg-white text-ink border border-solid border-border hover:bg-surface-alt disabled:opacity-40"
                  >
                    {t[`gameHint_${h}`]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="text-dynamic-sm mb-4 space-y-1">
            {(question.hints.includes('gloss') || question.result) && (
              <div>
                {t.gameMeaning} <span className="text-muted text-dynamic-xs">({t.gameMeaningSource})</span>:{' '}
                <em dir="ltr" className="inline-block">{question.meaning === undefined ? '…' : question.meaning || t.gameNoHint}</em>
              </div>
            )}
            {question.hints.includes('first') && mode === 'choose' && (
              <div>{t.gameFirstLetter}: <span className="arabic">{question.letters[0]}</span></div>
            )}
            {question.hints.includes('related') && (
              <div>
                {t.gameRelated}:{' '}
                {!question.words ? '…' : related.length ? related.map((w) => (
                  <button
                    key={w.word_id}
                    onClick={(e) => (question.result ? openMenu(w, e) : showRelated(w))}
                    className={`arabic me-2 mb-1 py-0.5 px-2 rounded-md border border-solid border-border text-ink hover:bg-surface-alt ${
                      w.word_id in question.related ? 'bg-surface-dark' : 'bg-white'
                    }`}
                    title={question.result ? t.gameTapWord : t.gameShowMeaning}
                  >
                    {w.arabic}
                  </button>
                )) : t.gameNoHint}
                {related?.filter((w) => w.word_id in question.related).map((w) => (
                  <div key={w.word_id} className="text-dynamic-xs mt-1">
                    <span className="arabic">{w.arabic}</span>:{' '}
                    <em dir="ltr" className="inline-block">
                      {question.related[w.word_id] === undefined ? '…' : question.related[w.word_id] || t.gameNoHint}
                    </em>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

          <div>

          {/* Answer */}
          {mode === 'type' ? (
            <>
              <div className="flex justify-center gap-2 mb-4" dir="rtl">
                {question.letters.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => clearSlot(i)}
                    className={`${question.letters.length > 4 ? 'w-11 h-11' : 'w-14 h-14'} rounded-lg border-2 border-solid border-border-dark arabic text-[28px] p-0 flex items-center justify-center text-ink ${
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
                        className="h-11 lg:h-12 p-0 rounded-md bg-surface text-ink border border-solid border-border-light hover:bg-surface-alt arabic text-[22px]"
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
                    className={`h-14 rounded-lg arabic text-[24px] p-0 border-2 border-solid ${
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
                {scored && <span className="text-muted text-dynamic-sm"> (+{num(points(mode, question.hints.length))})</span>}
              </p>
              {!roundOver && <button onClick={next} className="py-2 px-6 rounded-md">{t.gameNext}</button>}
            </div>
          )}
          </div>
          </div>

          {/* The word's graph */}
          {graphOpen && (
            <div ref={graphRef} className="mt-6 [&>div:last-child]:h-[420px]" data-testid="game-graph">
              <div className="flex justify-between items-center mb-2">
                <span className="text-dynamic-sm text-muted">{t.viewGraphShort}</span>
                <button onClick={() => setGraphOpen(false)} className={quiet}>{t.close}</button>
              </div>
              <GraphVisualization data={graphData} onNodeClick={(node, e) => handleNodeClick(node, L1, L2, e)} />
            </div>
          )}

          {/* Round summary */}
          {roundOver && (
            <div className="mt-6 p-4 rounded-xl border border-border-light">
              <h3 className="mb-2">{t.gameRoundOver}</h3>
              <p className="mb-2">
                {t.gameScore}: <strong>{num(round.score)}</strong> / {num(ROUND_LENGTH * points(mode, 0))} · {t.gameBest}: {num(best)}
              </p>
              <ul className="mb-4 p-0 list-none">
                {round.history.map((h, i) => (
                  <li key={i} className="my-1 cursor-default grid grid-cols-4 gap-2 items-center text-dynamic-sm">
                    <span className="arabic" dir="rtl">{h.word}</span>
                    <span className="arabic" dir="rtl">{h.root}</span>
                    <span className="text-muted">{num(h.ref)}</span>
                    <span className={`text-end ${h.gained ? 'text-success' : 'text-danger'}`}>+{num(h.gained)}</span>
                  </li>
                ))}
              </ul>
              <button onClick={next} className="py-2 px-6 rounded-md">{t.gamePlayAgain}</button>
            </div>
          )}
        </div>
      )}

      {menu && (
        <NodeContextMenu
          node={menu.node}
          position={menu.position}
          extraOptions={[{ label: t.viewGraphShort, action: 'view-graph' }]}
          onAction={menuAction}
          onClose={() => setMenu(null)}
        />
      )}
      {infoBubble && (
        <InfoBubble
          nodeData={infoBubble.nodeData || { definitions: infoBubble.definition }}
          onClose={() => setInfoBubble(null)}
          style={{ top: `${infoBubble.position.y}px`, left: `${infoBubble.position.x}px` }}
        />
      )}
      {/* The graph shows its own inspector */}
      {nodeInspectorData && !graphOpen && (
        <NodeInspector nodeData={nodeInspectorData} onClose={() => setNodeInspectorData(null)} onNavigate={handleNodeNavigation} />
      )}
    </div>
  );
};

export default RootGame;
