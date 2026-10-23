import { render, screen, fireEvent } from '@testing-library/react';
import MobileQuranReader from './MobileQuranReader';

const word = (ayah, n, sem, root, extra = {}) => ({
  item_id: `1:${ayah}:${n}`,
  aya_index: ayah,
  arabic: sem,
  sem,
  root,
  english: null,
  transliteration: null,
  ...extra,
});

const nav = (overrides = {}) => ({
  currentStartAya: 1,
  currentEndAya: 2,
  prevDisabled: true,
  nextDisabled: false,
  onPrev: jest.fn(),
  onNext: jest.fn(),
  ...overrides,
});

const setup = (groupedByAya, props = {}) => {
  const onWordTap = jest.fn();
  const onAyahMenu = jest.fn();
  render(
    <MobileQuranReader
      surah={1}
      setSurah={jest.fn()}
      groupedByAya={groupedByAya}
      nav={nav()}
      ayaCount={7}
      L1="sem"
      L2="off"
      fontSize={16}
      getWordStyle={() => ({})}
      onWordTap={onWordTap}
      onAyahMenu={onAyahMenu}
      {...props}
    />
  );
  return { onWordTap, onAyahMenu };
};

beforeEach(() => localStorage.clear());

test('renders each ayah with its words, roots and range', () => {
  setup({
    1: [word(1, 1, 'بِسْمِ', 'سمو'), word(1, 2, 'اللَّهِ', 'اله')],
    2: [word(2, 1, 'الْحَمْدُ', 'حمد')],
  });
  expect(screen.getByText('1:1')).toBeInTheDocument();
  expect(screen.getByText('1:2')).toBeInTheDocument();
  expect(screen.getByText('الْحَمْدُ')).toBeInTheDocument();
  expect(screen.getByText('ح م د')).toBeInTheDocument();
  expect(screen.getByText(/Ayat 1–2 of 7/)).toBeInTheDocument();
});

test('al-Fatiha does not repeat the basmala above ayah 1', () => {
  setup({ 1: [word(1, 1, 'بِسْمِ', 'سمو')] });
  expect(screen.queryByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBeNull();
});

test('only offers toggles for data the page has; root toggle hides roots', () => {
  setup({ 1: [word(1, 1, 'بِسْمِ', 'سمو')] });
  expect(screen.queryByLabelText('Show word meanings')).toBeNull();
  expect(screen.queryByLabelText('Show transliteration')).toBeNull();
  fireEvent.click(screen.getByLabelText('Show roots'));
  expect(screen.queryByText('س م و')).toBeNull();
  expect(localStorage.getItem('mobileReader.show.root')).toBe('false');
});

test('shows meanings when present, preferring the chosen second language', () => {
  setup(
    { 1: [word(1, 1, 'بِسْمِ', 'سمو', { english: 'In (the) name', fr: 'Au nom' })] },
    { L2: 'fr' }
  );
  expect(screen.getByText('Au nom')).toBeInTheDocument();
});

test('word tap and ayah menu call the shared handlers', () => {
  const { onWordTap, onAyahMenu } = setup({ 1: [word(1, 1, 'بِسْمِ', 'سمو')] });
  fireEvent.click(screen.getByText('بِسْمِ'));
  expect(onWordTap).toHaveBeenCalledWith(expect.objectContaining({ item_id: '1:1:1' }));
  fireEvent.click(screen.getByLabelText('Ayah 1:1 options'));
  expect(onAyahMenu).toHaveBeenCalledWith(expect.anything(), '1');
});
