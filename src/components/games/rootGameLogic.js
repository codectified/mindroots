// Logic for the "find the root" game: answer checking, word segments,
// difficulty levels, multiple-choice options and scoring. No React here, so
// it's easy to test.
//
// Quran CorpusItems carry `root` as plain letters ("علم", "ابب"; hamza is
// written ا) and QAC segments s1..s8 (`sN_arabic`, `sN_features`, where the
// features start with PREFIX, STEM or SUFFIX). Lexicon questions are built
// from a Root and one of its Words, in the same shape.

export const RADICALS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
];

// The letters that alternate inside a root (قال from قول, رمى from رمي).
// Roots write hamza as ا, so hamzated roots count as weak here too.
const WEAK = new Set(['ا', 'و', 'ي']);

const SHADDA = 'ّ';
const MARKS = /[ً-ْٰـ]/g;

export const normalizeLetter = (ch) => {
  if ('أإآءئؤٱ'.includes(ch)) return 'ا';
  if (ch === 'ى') return 'ي';
  return ch;
};

export const stripDiacritics = (s = '') => s.replace(MARKS, '');

// Some item texts carry stray markers (أَحَدٌ[); keep Arabic and spaces only.
export const cleanArabic = (s = '') => s.replace(/[^؀-ۿ\s]/g, '').replace(/\s+/g, ' ').trim();

export const isArabicWord = (s = '') => /^[؀-ۿ\s]+$/.test(s.trim()) && /[ء-ي]/.test(s);

export const rootLetters = (root = '') => [...stripDiacritics(root).replace(/[-\s]/g, '')].map(normalizeLetter);

export const formatRoot = (root) => rootLetters(root).join('-');

// 'exact' | 'weak' (right except for a و/ي/ا swap) | 'wrong'
export const checkRoot = (guess, root) => {
  const answer = rootLetters(root);
  const letters = guess.map(normalizeLetter);
  if (letters.length !== answer.length) return 'wrong';
  let weak = false;
  for (let i = 0; i < answer.length; i++) {
    if (letters[i] === answer[i]) continue;
    if (WEAK.has(letters[i]) && WEAK.has(answer[i])) weak = true;
    else return 'wrong';
  }
  return weak ? 'weak' : 'exact';
};

export const wordSegments = (item) => {
  const segments = [];
  for (let k = 1; k <= 8; k++) {
    const arabic = item[`s${k}_arabic`];
    const features = item[`s${k}_features`] || '';
    if (!arabic) continue;
    const kind = features.startsWith('STEM') ? 'stem' : features.startsWith('SUFFIX') ? 'suffix' : 'prefix';
    segments.push({ arabic: cleanArabic(arabic), kind });
  }
  return segments.length ? segments : [{ arabic: cleanArabic(item.sem || item.full_arabic), kind: 'stem' }];
};

// The part of the word the root letters should be found in.
const stemOf = (item) => wordSegments(item).filter((s) => s.kind === 'stem').map((s) => s.arabic).join('');

// Only rooted words can be played: particles and pronouns have no root.
export const isPlayable = (item) =>
  Boolean(item && item.root) && [3, 4].includes(rootLetters(item.root).length) && Boolean(item.sem || item.full_arabic);

// ── Difficulty ─────────────────────────────────────────────────────────
// beginner:     sound roots (no و/ي/ا or hamza, no doubled letter), and every
//               root letter is written in the word, in order (كَتَبُوا → ك-ت-ب)
// intermediate: any root, as long as every letter is still written in the
//               word (قَوْل → ق-و-ل, مَدَّ → م-د-د via the shadda)
// advanced:     anything, including letters that drop or change (قَالَ, يَعِدُ, رَمَى)
export const LEVELS = ['beginner', 'intermediate', 'advanced'];

export const rootKind = (root) => {
  const l = rootLetters(root);
  return {
    weak: l.some((ch) => WEAK.has(ch)),
    doubled: l.some((ch, i) => i > 0 && ch === l[i - 1]),
  };
};

// Every root letter appears in the word in order. A shadda doubles its letter.
export const lettersVisible = (root, word = '') => {
  const letters = [];
  for (const ch of word) {
    if (ch === SHADDA && letters.length) letters.push(letters[letters.length - 1]);
    else if (!ch.match(MARKS) && ch.trim()) letters.push(normalizeLetter(ch));
  }
  let i = 0;
  for (const r of rootLetters(root)) {
    while (i < letters.length && letters[i] !== r) i++;
    if (i === letters.length) return false;
    i++;
  }
  return true;
};

export const fitsLevel = (root, word, level) => {
  if (level === 'advanced') return true;
  if (level === 'beginner') {
    const { weak, doubled } = rootKind(root);
    if (weak || doubled) return false;
  }
  return lettersVisible(root, word);
};

export const itemFitsLevel = (item, level) => fitsLevel(item.root, stemOf(item) || item.sem, level);

export const MAX_HINTS = 4;

export const points = (mode, hintsUsed) => Math.max((mode === 'type' ? 10 : 5) - 2 * hintsUsed, 1);

const shuffle = (arr, rand) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const pickRandom = (arr, rand = Math.random) => arr[Math.floor(rand() * arr.length)];

// Four options: the answer plus distractors from `pool` (other roots, any
// format), preferring ones with the same number of letters.
export const pickChoices = (root, pool, n = 4, rand = Math.random) => {
  const answer = formatRoot(root);
  const seen = new Set([answer]);
  const candidates = [];
  for (const r of shuffle(pool, rand)) {
    const f = formatRoot(r);
    if (!f || seen.has(f)) continue;
    seen.add(f);
    candidates.push(f);
  }
  const sameLength = candidates.filter((f) => f.length === answer.length);
  const others = candidates.filter((f) => f.length !== answer.length);
  return shuffle([answer, ...[...sameLength, ...others].slice(0, n - 1)], rand);
};

// The Word under the root that is this lemma: the same vowelled spelling if
// there is one (عِلْم, not عَلِمَ), otherwise the same consonants.
const lemmaWord = (words, lemma = '') => {
  // Lexicon headwords carry tanwin (قَوْلٌ) where QAC lemmas don't (قَوْل)
  const vowelled = (s = '') => [...s.replace(/[ـً-ٍ]/g, '')].map(normalizeLetter).join('');
  const bare = (s) => vowelled(stripDiacritics(s));
  return words.find((w) => vowelled(w.arabic) === vowelled(lemma))
    || words.find((w) => bare(w.arabic) === bare(lemma))
    || null;
};

// The English gloss of the word, from the Words under its root.
export const glossFor = (words, lemma) => lemmaWord(words, lemma)?.english || null;

// Other Words from the same root, for the "related words" hint.
export const relatedWords = (words, lemma, n = 3) => {
  const own = lemmaWord(words, lemma);
  return words.filter((w) => w !== own && w.english).slice(0, n);
};

// Lexicon mode: the Arabic nouns and verbs under a root that suit the level.
export const lexiconCandidates = (root, words, level) =>
  words.filter((w) => ['noun', 'verb'].includes(w.word_type) && w.english && isArabicWord(w.arabic)
    && fitsLevel(root, w.arabic.split(/\s+/)[0], level));
