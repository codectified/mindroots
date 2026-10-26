import {
  checkRoot, cleanArabic, formatRoot, wordSegments, isPlayable, points, pickChoices, glossFor, relatedWords, rootLetters,
  rootKind, rootFitsLevel, isFormOneItem, isFormOneVerb, itemFitsLevel, lexiconCandidates,
} from './rootGameLogic';

describe('checkRoot', () => {
  it('accepts the exact root', () => {
    expect(checkRoot(['ع', 'ل', 'م'], 'علم')).toBe('exact');
    expect(checkRoot(['أ', 'ب', 'ب'], 'ابب')).toBe('exact'); // hamza is written ا
  });

  it('accepts a weak-letter swap as close', () => {
    expect(checkRoot(['ق', 'ا', 'ل'], 'قول')).toBe('weak'); // guessed from قَالَ
    expect(checkRoot(['ر', 'م', 'ى'], 'رمي')).toBe('exact'); // ى is ي
  });

  it('rejects wrong letters and wrong length', () => {
    expect(checkRoot(['ع', 'ل', 'ن'], 'علم')).toBe('wrong');
    expect(checkRoot(['ع', 'ل'], 'علم')).toBe('wrong');
  });
});

describe('words', () => {
  const item = {
    root: 'ابب', sem: 'وَأَبًّا',
    s1_arabic: 'وَ', s1_features: 'PREFIX|w:CONJ+',
    s2_arabic: 'أَبًّا', s2_features: 'STEM|POS:N|LEM:>ab~|ROOT:Abb|M|INDEF|ACC',
  };

  it('splits a word into prefix, stem and suffix', () => {
    expect(wordSegments(item)).toEqual([
      { arabic: 'وَ', kind: 'prefix' },
      { arabic: 'أَبًّا', kind: 'stem' },
    ]);
    expect(wordSegments({ s1_arabic: 'كِتَٰب', s1_features: 'STEM|POS:N', s2_arabic: 'هُمْ', s2_features: 'SUFFIX|PRON:3MP' })
      .map((s) => s.kind)).toEqual(['stem', 'suffix']);
  });

  it('only plays rooted words', () => {
    expect(isPlayable(item)).toBe(true);
    expect(isPlayable({ sem: 'مِنْ' })).toBe(false);
  });

  it('drops stray markers from word text', () => {
    expect(cleanArabic('أَحَدٌ[')).toBe('أَحَدٌ');
    expect(wordSegments({ sem: 'أَحَدٌ[' })).toEqual([{ arabic: 'أَحَدٌ', kind: 'stem' }]);
  });

  it('formats roots', () => {
    expect(formatRoot('علم')).toBe('ع-ل-م');
    expect(formatRoot('ا-ب-ب')).toBe('ا-ب-ب');
    expect(rootLetters('زلزل')).toHaveLength(4);
  });
});

describe('scoring and options', () => {
  it('takes 2 points per hint, never below 1', () => {
    expect(points('type', 0)).toBe(10);
    expect(points('type', 2)).toBe(6);
    expect(points('choose', 3)).toBe(1);
  });

  it('offers the answer plus distinct distractors', () => {
    const choices = pickChoices('علم', ['ع-ل-م', 'ك-ت-ب', 'ق-و-ل', 'ر-ح-م', 'ز-ل-ز-ل'], 4, () => 0.5);
    expect(choices).toHaveLength(4);
    expect(choices).toContain('ع-ل-م');
    expect(new Set(choices).size).toBe(4);
    expect(choices).not.toContain('ز-ل-ز-ل'); // same length preferred
  });

  it('finds the gloss of the lemma', () => {
    const words = [{ arabic: 'عَلِمَ', english: 'to know' }, { arabic: 'عِلْم', english: 'knowledge' }];
    expect(glossFor(words, 'عِلْم')).toBe('knowledge');
    expect(glossFor(words, 'عَالَم')).toBeNull();
    expect(relatedWords(words, 'عِلْم')).toEqual([words[0]]);
    expect(glossFor([{ arabic: 'قَوْلٌ', english: 'saying' }, { arabic: 'قَالَ', english: 'said' }], 'قَوْل')).toBe('saying');
  });
});

describe('levels', () => {
  it('classifies roots', () => {
    expect(rootKind('كتب')).toEqual({ weak: false, doubled: false });
    expect(rootKind('قول').weak).toBe(true);
    expect(rootKind('ابب')).toEqual({ weak: true, doubled: true }); // hamza counts as weak
    expect(rootKind('مدد').doubled).toBe(true);
  });

  it('filters roots by level', () => {
    expect(rootFitsLevel('كتب', 'beginner')).toBe(true);
    expect(rootFitsLevel('مدد', 'beginner')).toBe(false); // doubled
    expect(rootFitsLevel('مدد', 'intermediate')).toBe(true);
    expect(rootFitsLevel('قول', 'intermediate')).toBe(false); // weak
    expect(rootFitsLevel('اكل', 'intermediate')).toBe(false); // hamzated
    expect(rootFitsLevel('زلزل', 'intermediate')).toBe(false);
    expect(rootFitsLevel('قول', 'advanced')).toBe(true);
    expect(rootFitsLevel('زلزل', 'advanced')).toBe(true);
    expect(rootFitsLevel('اسطرلاب', 'advanced')).toBe(true);
  });

  it('recognises Form I verbs in Quran items', () => {
    const verb = (features) => ({ root: 'كتب', s1_arabic: 'كَتَبَ', s1_features: features });
    expect(isFormOneItem(verb('STEM|POS:V|PERF|LEM:kataba|ROOT:ktb|3MS'))).toBe(true);
    expect(isFormOneItem(verb('STEM|POS:V|IMPF|PASS|LEM:kataba|ROOT:ktb|3MS'))).toBe(true);
    expect(isFormOneItem(verb('STEM|POS:V|PERF|(II)|LEM:qad~ara|ROOT:qdr|3MP'))).toBe(false);
    expect(isFormOneItem(verb('STEM|POS:V|PERF|(X)|LEM:{sotakobara|ROOT:kbr|3MS'))).toBe(false);
    expect(isFormOneItem(verb('STEM|POS:N|LEM:kitaAb|ROOT:ktb|M|NOM'))).toBe(false);
    // the stem, not a prefix, decides
    expect(isFormOneItem({ s1_features: 'PREFIX|w:CONJ+', s2_features: 'STEM|POS:V|PERF|LEM:kataba|ROOT:ktb|3MS' })).toBe(true);
  });

  it('recognises Form I verbs in the lexicon', () => {
    expect(isFormOneVerb('كتب', 'كَتَبَ')).toBe(true);
    expect(isFormOneVerb('كتب', 'كَتَبَهُ')).toBe(true); // with an object pronoun
    expect(isFormOneVerb('بخع', 'بَخَعَ الذَّبِيحَةَ')).toBe(true); // a phrase headword
    expect(isFormOneVerb('كتب', 'كَتَّبَ')).toBe(false); // II
    expect(isFormOneVerb('كتب', 'كَاتَبَ')).toBe(false); // III
    expect(isFormOneVerb('كتب', 'أَكْتَبَ')).toBe(false); // IV
    expect(isFormOneVerb('كتب', 'إِكْتَتَبَ')).toBe(false); // VIII
    expect(isFormOneVerb('كتب', 'استكتبهُ')).toBe(false); // X
  });

  it('filters Quran items by level', () => {
    const noun = { root: 'كتب', s1_arabic: 'كِتَٰب', s1_features: 'STEM|POS:N|LEM:kitaAb|ROOT:ktb' };
    const verb = { root: 'كتب', s1_arabic: 'كَتَبَ', s1_features: 'STEM|POS:V|PERF|LEM:kataba|ROOT:ktb|3MS' };
    expect(itemFitsLevel(verb, 'beginner')).toBe(true);
    expect(itemFitsLevel(noun, 'beginner')).toBe(false);
    expect(itemFitsLevel(noun, 'intermediate')).toBe(true);
  });

  it('keeps Arabic nouns and verbs with a gloss for the lexicon', () => {
    const words = [
      { arabic: 'كَتَبَ', english: 'wrote', word_type: 'verb' },
      { arabic: 'כתב', english: 'write', word_type: 'verb' },
      { arabic: 'كِتَابٌ', english: null, word_type: 'noun' },
      { arabic: 'اِكْتَتَبَ', english: 'subscribed', word_type: 'phrase' },
      { arabic: 'كَتَّبَ', english: 'taught to write', word_type: 'verb' },
      { arabic: 'مَكْتَبٌ', english: 'school', word_type: 'noun' },
    ];
    expect(lexiconCandidates('كتب', words, 'beginner')).toEqual([words[0]]);
    expect(lexiconCandidates('كتب', words, 'intermediate')).toEqual([words[0], words[4], words[5]]);
    expect(lexiconCandidates('قول', [{ arabic: 'قَالَ', english: 'said', word_type: 'verb' }], 'intermediate')).toEqual([]);
  });

  it('keeps spaces when cleaning text', () => {
    expect(cleanArabic('تَقَوَّلَ عَلَيْهِ')).toBe('تَقَوَّلَ عَلَيْهِ');
  });
});
