// Word class and gender for highlighting, across corpora.
//
// Classical three-way split: ism (noun), fiʿl (verb), ḥarf (particle).
// Quran items carry Quranic Arabic Corpus tags. The backend sends the tag of
// the STEM segment as `stem_tag` (`pos` is the first segment's tag, which is
// the prefix for words like وَقَالُوا, so it's only a fallback). Poetry items
// carry free-text `pos` / `gender` values ("noun", "Particle", "female"...).

// QAC nominal tags: everything grammar counts as an ism, incl. pronouns,
// demonstratives, relatives and adverbs of time/place.
const QAC_NOUNS = new Set(['N', 'PN', 'ADJ', 'IMPN', 'PRON', 'DEM', 'REL', 'T', 'LOC']);
const TEXT_NOUNS = ['noun', 'adjective', 'pronoun', 'demonstrative', 'adverb', 'proper'];
const TEXT_NONE = ['punctuation'];

export const wordClass = (item) => {
  const tag = item.stem_tag || item.pos;
  if (!tag) return null;
  if (tag === 'V') return 'verb';
  if (QAC_NOUNS.has(tag)) return 'noun';
  if (/^[A-Z]+$/.test(tag)) return 'particle';
  const text = tag.toLowerCase();
  if (text.startsWith('verb')) return 'verb';
  if (TEXT_NOUNS.some((n) => text.startsWith(n))) return 'noun';
  if (TEXT_NONE.some((n) => text.startsWith(n))) return null;
  return 'particle';
};

// QAC stem features look like "STEM|POS:N|LEM:{som|ROOT:smw|M|GEN" or
// "STEM|POS:V|PERF|LEM:qaAla|ROOT:qwl|3FS"; the gender is the M/F in a
// person-gender-number token.
const QAC_GENDER = /^[123]?([MF])[SDP]?$/;

export const wordGender = (item) => {
  if (item.stem_features) {
    const token = item.stem_features.split('|').find((t) => QAC_GENDER.test(t));
    if (!token) return null;
    return token.match(QAC_GENDER)[1] === 'F' ? 'feminine' : 'masculine';
  }
  const g = (item.gender || '').toLowerCase();
  if (g.startsWith('fem') || g.startsWith('female')) return 'feminine';
  if (g.startsWith('masc') || g.startsWith('male')) return 'masculine';
  return null;
};
