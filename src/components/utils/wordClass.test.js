import { wordClass, wordGender } from './wordClass';

describe('wordClass', () => {
  it('uses the Quran stem tag, not the prefix tag', () => {
    expect(wordClass({ pos: 'CONJ', stem_tag: 'V' })).toBe('verb'); // وَعَمِلُوا
    expect(wordClass({ pos: 'DET', stem_tag: 'N' })).toBe('noun'); // الصَّٰلِحَٰتِ
    expect(wordClass({ pos: 'P', stem_tag: 'PRON' })).toBe('noun'); // لَهُمْ
    expect(wordClass({ pos: 'ACC', stem_tag: 'ACC' })).toBe('particle'); // أَنَّ
  });

  it('falls back to pos when the backend has no stem_tag yet', () => {
    expect(wordClass({ pos: 'V' })).toBe('verb');
    expect(wordClass({ pos: 'REL' })).toBe('noun');
    expect(wordClass({ pos: 'NEG' })).toBe('particle');
  });

  it('reads free-text poetry tags', () => {
    expect(wordClass({ pos: 'noun' })).toBe('noun');
    expect(wordClass({ pos: 'demonstrative pronoun' })).toBe('noun');
    expect(wordClass({ pos: 'verb' })).toBe('verb');
    expect(wordClass({ pos: 'Particle' })).toBe('particle');
    expect(wordClass({ pos: 'preposition' })).toBe('particle');
    expect(wordClass({ pos: 'punctuation' })).toBeNull();
    expect(wordClass({})).toBeNull();
  });
});

describe('wordGender', () => {
  it('reads QAC person-gender-number tokens', () => {
    expect(wordGender({ stem_features: 'STEM|POS:N|ACT|PCPL|LEM:S~a`liHa`t|ROOT:SlH|FP|ACC' })).toBe('feminine');
    expect(wordGender({ stem_features: 'STEM|POS:V|PERF|LEM:qaAlat|ROOT:qwl|3FS' })).toBe('feminine');
    expect(wordGender({ stem_features: 'STEM|POS:N|LEM:{som|ROOT:smw|M|GEN' })).toBe('masculine');
    expect(wordGender({ stem_features: 'STEM|POS:P|LEM:fiY' })).toBeNull();
  });

  it('reads free-text poetry genders', () => {
    expect(wordGender({ gender: 'feminine plural' })).toBe('feminine');
    expect(wordGender({ gender: 'female' })).toBe('feminine');
    expect(wordGender({ gender: 'masculine' })).toBe('masculine');
    expect(wordGender({ gender: 'N/A' })).toBeNull();
  });
});
