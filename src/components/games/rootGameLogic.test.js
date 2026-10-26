import {
  checkRoot, cleanArabic, formatRoot, wordSegments, isPlayable, points, pickChoices, glossFor, relatedWords, rootLetters,
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
