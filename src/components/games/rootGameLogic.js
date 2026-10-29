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

// Only rooted words can be played: particles and pronouns have no root.
export const isPlayable = (item) =>
  Boolean(item && item.root) && rootLetters(item.root).length >= 3 && Boolean(item.sem || item.full_arabic);

// ── Difficulty ─────────────────────────────────────────────────────────
// beginner:     Form I verbs (فَعَلَ, يَفْعَلُ) from sound triliteral roots:
//               no و/ي/ا or hamza, no doubled letter (كَتَبَ → ك-ت-ب)
// intermediate: any word from a sound triliteral root, now including
//               doubled (biliteral) roots (مَدَّ → م-د-د)
// advanced:     only the hard cases: weak and hamzated roots (قَالَ → ق-و-ل,
//               أَكَلَ) and roots of four or more letters (زَلْزَلَ), and
//               never a Form I verb
export const LEVELS = ['beginner', 'intermediate', 'advanced'];

export const rootKind = (root) => {
  const l = rootLetters(root);
  return {
    weak: l.some((ch) => WEAK.has(ch)),
    doubled: l.some((ch, i) => i > 0 && ch === l[i - 1]),
  };
};

export const rootFitsLevel = (root, level) => {
  const length = rootLetters(root).length;
  const { weak, doubled } = rootKind(root);
  if (level === 'advanced') return length > 3 || (length === 3 && weak);
  if (length !== 3) return false;
  return !weak && (level === 'intermediate' || !doubled);
};

// QAC marks derived verb forms on the stem, "(II)" to "(XII)"; Form I has none.
export const isFormOneItem = (item) => {
  const stem = Array.from({ length: 8 }, (_, k) => item[`s${k + 1}_features`] || '').find((f) => f.startsWith('STEM')) || '';
  return /\|POS:V(\||$)/.test(stem) && !/\([IVX]+\)/.test(stem);
};

// Lexicon verbs are headed by the perfect, often with an object pronoun
// (كَتَبَهُ). Form I is the bare root letters: no shadda (II), no added
// letters (أَفْعَلَ, فَاعَلَ, تَفَعَّلَ, اِفْتَعَلَ, ...).
const OBJECT_PRONOUN = /^(|ه|ها|هما|هم|هن|ك|كما|كم|كن|ني|نا)$/;
export const isFormOneVerb = (root, word = '') => {
  const head = word.split(/\s+/)[0];
  if (head.includes(SHADDA)) return false;
  const bare = [...stripDiacritics(head)].map(normalizeLetter).join('');
  const letters = rootLetters(root).join('');
  return bare.startsWith(letters) && OBJECT_PRONOUN.test(bare.slice(letters.length));
};

// Lexicon verbs carry their form number (itype); without it, read the headword.
export const isFormOneWord = (root, word) => word.word_type === 'verb'
  && (word.itype != null ? String(word.itype) === '1' : isFormOneVerb(root, word.arabic));

export const itemFitsLevel = (item, level) => {
  if (!rootFitsLevel(item.root, level)) return false;
  if (level === 'beginner') return isFormOneItem(item);
  if (level === 'advanced') return !isFormOneItem(item);
  return true;
};

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
export const lemmaWord = (words, lemma = '') => {
  // Lexicon headwords carry tanwin (قَوْلٌ) where QAC lemmas don't (قَوْل)
  const vowelled = (s = '') => [...s.replace(/[ـً-ٍ]/g, '')].map(normalizeLetter).join('');
  const bare = (s) => vowelled(stripDiacritics(s));
  return words.find((w) => vowelled(w.arabic) === vowelled(lemma))
    || words.find((w) => bare(w.arabic) === bare(lemma))
    || null;
};

// A short meaning from the Word's Lane entry (Word.definitions). Lane writes
// English with the Arabic in between, split by ';'. The Arabic would give the
// root away, so it becomes '…'; source sigla (S, K), Lane's [insertions],
// sense markers (-A2-), grammar abbreviations and "see ..." cross-references
// go too. Word.english is not used: many of those glosses are wrong.
export const laneGloss = (definitions, max = 180) => {
  let text = (definitions || '').split(';').map((s) => s.trim()).map((s) => (/[؀-ۿ]/.test(s) ? '…' : s)).join(' ')
    .replace(/^\d+\s*/, '')
    .replace(/\([^()]*\)/g, '')
    .replace(/\[[^\][]*\]/g, '')
    .replace(/-[A-Za-z]\d+-/g, '')
    .replace(/\b(?:aor|inf\. ns?|pl|dim|fem|q\. ?v|i\. q)\./g, '')
    .replace(/\baccord\. to [A-Z][\w']*,?/g, '')
    .replace(/[:,]?\s*\bsee\b[^.:;A-Z]*\.?/gi, ' ')
    .replace(/\b(?:also|and|or)\b(?:[\s,]*…)+/gi, '…')
    .replace(/\s+([,.:;!])/g, '$1')
    .replace(/(?:…[\s,.:]*)+/g, '… ')
    .replace(/\s+/g, ' ')
    .trim();
  const start = text.search(/[A-Z“"]/);
  if (start < 0) return null;
  text = text.slice(start).replace(/^(?:Also|And),?\s+/, '').replace(/[…,:;\s]+$/, '');
  if (!/[A-Za-z]{2,}\W+[A-Za-z]{2,}/.test(text)) return null;
  return text.length > max ? `${text.slice(0, text.lastIndexOf(' ', max))} …` : text;
};

// Other Arabic Words from the same root, for the "related words" hint.
export const relatedWords = (words, lemma, n = 3) => {
  const own = lemmaWord(words, lemma);
  return words.filter((w) => w !== own && isArabicWord(w.arabic)).slice(0, n);
};

// Lexicon mode: the Arabic nouns and verbs under a root that suit the level.
export const lexiconCandidates = (root, words, level) => {
  if (!rootFitsLevel(root, level)) return [];
  return words.filter((w) => ['noun', 'verb'].includes(w.word_type) && isArabicWord(w.arabic)
    && (level === 'beginner' ? isFormOneWord(root, w) && isFormOneVerb(root, w.arabic)
      : level !== 'advanced' || !isFormOneWord(root, w)));
};
