// Logic for the "find the root" game: answer checking, word segments,
// multiple-choice options and scoring. No React here, so it's easy to test.
//
// Quran CorpusItems carry `root` as plain letters ("علم", "ابب"; hamza is
// written ا) and QAC segments s1..s8 (`sN_arabic`, `sN_features`, where the
// features start with PREFIX, STEM or SUFFIX).

export const RADICALS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
];

// The letters that alternate inside a root (قال from قول, رمى from رمي).
const WEAK = new Set(['ا', 'و', 'ي']);

export const normalizeLetter = (ch) => {
  if ('أإآءئؤٱ'.includes(ch)) return 'ا';
  if (ch === 'ى') return 'ي';
  return ch;
};

export const stripDiacritics = (s = '') => s.replace(/[ً-ْٰـ]/g, '');

// Some item texts carry stray markers (أَحَدٌ[); keep Arabic letters and marks only.
export const cleanArabic = (s = '') => s.replace(/[^؀-ۿs]/g, '').trim();

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

// Only rooted words can be played: particles and pronouns have no root.
export const isPlayable = (item) =>
  Boolean(item && item.root) && [3, 4].includes(rootLetters(item.root).length) && Boolean(item.sem || item.full_arabic);

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
