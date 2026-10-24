import { getQuranNav } from './quranNav';

const make = (surah, ayaNumbers, ayaCount, ayahsPerPage = 10) => {
  const setSurah = jest.fn();
  const setAya = jest.fn();
  const nav = getQuranNav({ surah, ayaNumbers, ayaCount, ayahsPerPage, setSurah, setAya });
  return { nav, setSurah, setAya };
};

test('Next within a surah continues after the last ayah on screen', () => {
  const { nav, setSurah, setAya } = make(2, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 286);
  expect(nav.atSurahEnd).toBe(false);
  nav.onNext();
  expect(setAya).toHaveBeenCalledWith(11);
  expect(setSurah).not.toHaveBeenCalled();
});

test('Next at the end of a short surah goes to the next surah', () => {
  const { nav, setSurah, setAya } = make(1, [1, 2, 3, 4, 5, 6, 7], 7);
  expect(nav.atSurahEnd).toBe(true);
  nav.onNext();
  expect(setSurah).toHaveBeenCalledWith(2);
  expect(setAya).toHaveBeenCalledWith(0);
});

test('Previous at the start of a surah opens the last page of the one before', () => {
  const { nav, setSurah, setAya } = make('3', [1, 2, 3], 200);
  nav.onPrev();
  expect(setSurah).toHaveBeenCalledWith(2);
  expect(setAya).toHaveBeenLastCalledWith(-1);
});

test('Previous mid-surah steps back one page, not past ayah 1', () => {
  const a = make(2, [21, 22, 23, 24, 25], 286, 5);
  a.nav.onPrev();
  expect(a.setAya).toHaveBeenCalledWith(16);
  const b = make(2, [4, 5, 6], 286, 5);
  b.nav.onPrev();
  expect(b.setAya).toHaveBeenCalledWith(1);
});

test('the ends of the mushaf are disabled', () => {
  expect(make(1, [1, 2], 7).nav.prevDisabled).toBe(true);
  expect(make(114, [1, 2, 3, 4, 5, 6], 6).nav.nextDisabled).toBe(true);
  expect(make(114, [1, 2], 6).nav.nextDisabled).toBe(false);
});
