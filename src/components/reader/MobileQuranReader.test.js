import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  atSurahStart: true,
  atSurahEnd: false,
  prevDisabled: true,
  nextDisabled: false,
  onPrev: jest.fn(),
  onNext: jest.fn(),
  ...overrides,
});

// quran.com /verses/by_chapter response for al-Fatiha 1–2
const quranCom = {
  verses: [
    {
      verse_number: 1,
      translations: [{ text: 'In the name of Allah<sup foot_note=1>1</sup>' }],
      audio: { url: 'Alafasy/mp3/001001.mp3', segments: [[0, 1, 0, 500]] },
      words: [
        { position: 1, char_type_name: 'word', translation: { text: 'In (the) name' }, transliteration: { text: "bis'mi" } },
        { position: 2, char_type_name: 'end', translation: { text: '(1)' } },
      ],
    },
    {
      verse_number: 2,
      translations: [{ text: 'All praise is for Allah' }],
      audio: { url: 'Alafasy/mp3/001002.mp3', segments: [] },
      words: [{ position: 1, char_type_name: 'word', translation: { text: 'All praises and thanks' } }],
    },
  ],
  pagination: { next_page: null },
};

let surahCounter = 0;
const setup = (groupedByAya, props = {}) => {
  const handlers = {
    onWordTap: jest.fn(),
    onAyahMenu: jest.fn(),
    setAya: jest.fn(),
    setAyahsPerPage: jest.fn(),
  };
  render(
    <MobileQuranReader
      surah={1}
      setSurah={jest.fn()}
      groupedByAya={groupedByAya}
      nav={nav()}
      ayaCount={7}
      ayahsPerPage={10}
      L1="sem"
      L2="off"
      fontSize={16}
      getWordStyle={() => ({})}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

const fatiha = () => ({
  1: [word(1, 1, 'بِسْمِ', 'سمو')],
  2: [word(2, 1, 'الْحَمْدُ', 'حمد')],
});

beforeEach(() => {
  localStorage.clear();
  surahCounter += 1;
  global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.warn.mockRestore();
});

test('renders each ayah with its words, roots and range', () => {
  setup(fatiha());
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

test('settings only offer switches for data the page has; roots switch hides roots', () => {
  setup({ 1: [word(1, 1, 'بِسْمِ', 'سمو')] });
  fireEvent.click(screen.getByLabelText('Reader settings'));
  expect(screen.queryByRole('switch', { name: 'Word meanings' })).toBeNull();
  expect(screen.queryByRole('switch', { name: 'Translation' })).toBeNull();
  fireEvent.click(screen.getByRole('switch', { name: 'Roots' }));
  expect(screen.queryByText('س م و')).toBeNull();
  expect(localStorage.getItem('mobileReader.show.root')).toBe('false');
});

test('adds word meanings, translation and audio from quran.com', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(quranCom) }));
  // a surah number nothing else in this file uses, so the module cache is cold
  setup(fatiha(), { surah: 50 + surahCounter });
  expect(await screen.findByText('In (the) name')).toBeInTheDocument();
  expect(screen.getByText('In the name of Allah')).toBeInTheDocument(); // footnote stripped
  expect(screen.getByText('All praise is for Allah')).toBeInTheDocument();
  expect(screen.queryByText("bis'mi")).toBeNull(); // transliteration is off by default
  expect(screen.getByLabelText('Play recitation')).toBeInTheDocument();
  expect(global.fetch.mock.calls[0][0]).toMatch(/from=1&to=2/);
});

test('the graph’s own word meaning wins over quran.com’s', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(quranCom) }));
  setup(
    { 1: [word(1, 1, 'بِسْمِ', 'سمو', { english: 'graph gloss', fr: 'Au nom' })], 2: [word(2, 1, 'الْحَمْدُ', 'حمد')] },
    { L2: 'fr', surah: 50 + surahCounter }
  );
  expect(screen.getByText('Au nom')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('All praises and thanks')).toBeInTheDocument());
  expect(screen.queryByText('In (the) name')).toBeNull();
});

test('translation and word-meaning languages can be changed and are remembered', async () => {
  const routes = {
    'resources/translations': {
      translations: [
        { id: 20, name: 'Saheeh International', language_name: 'english' },
        { id: 97, name: 'Tafheem e Quran', language_name: 'urdu' },
      ],
    },
    'resources/languages': { languages: [{ name: 'English', direction: 'ltr' }, { name: 'Urdu', direction: 'rtl' }] },
    'verses/by_chapter': quranCom,
  };
  global.fetch = jest.fn((url) => {
    const route = Object.keys(routes).find((r) => url.includes(r));
    return Promise.resolve({ ok: true, json: () => Promise.resolve(routes[route]) });
  });
  setup(fatiha(), { surah: 50 + surahCounter });
  fireEvent.click(screen.getByLabelText('Reader settings'));
  const picker = await screen.findByLabelText('Translation by');
  fireEvent.change(picker, { target: { value: '97' } });
  await waitFor(() =>
    expect(global.fetch.mock.calls.some(([url]) => /translations=97/.test(url))).toBe(true)
  );
  expect(localStorage.getItem('mobileReader.translation')).toBe('97');
  expect(await screen.findByText(/Translation: Tafheem e Quran/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Word meanings in'), { target: { value: 'ur' } });
  await waitFor(() => expect(global.fetch.mock.calls.some(([url]) => /language=ur/.test(url))).toBe(true));
  expect(localStorage.getItem('mobileReader.wordLanguage')).toBe('ur');
});

test('ayat per page and go-to-ayah drive paging', () => {
  const { setAyahsPerPage, setAya } = setup(fatiha());
  fireEvent.click(screen.getByLabelText('Reader settings'));
  fireEvent.click(screen.getByRole('button', { name: '5' }));
  expect(setAyahsPerPage).toHaveBeenCalledWith(5);
  fireEvent.change(screen.getByLabelText('Go to ayah'), { target: { value: '99' } });
  fireEvent.click(screen.getByRole('button', { name: 'Go' }));
  expect(setAya).not.toHaveBeenCalled(); // out of range is ignored
  fireEvent.change(screen.getByLabelText('Go to ayah'), { target: { value: '6' } });
  fireEvent.click(screen.getByRole('button', { name: 'Go' }));
  expect(setAya).toHaveBeenCalledWith(6);
  expect(screen.queryByLabelText('Go to ayah')).toBeNull(); // sheet closes
});

test('pager labels follow the position in the surah', () => {
  setup(fatiha(), { nav: nav({ atSurahStart: false, atSurahEnd: true, prevDisabled: false }) });
  expect(screen.getByText('‹ Previous')).toBeInTheDocument();
  expect(screen.getByText('Next surah ›')).toBeInTheDocument();
});

test('word tap and ayah menu call the shared handlers', () => {
  const { onWordTap, onAyahMenu } = setup({ 1: [word(1, 1, 'بِسْمِ', 'سمو')] });
  fireEvent.click(screen.getByText('بِسْمِ'));
  expect(onWordTap).toHaveBeenCalledWith(expect.objectContaining({ item_id: '1:1:1' }));
  fireEvent.click(screen.getByLabelText('Ayah 1:1 options'));
  expect(onAyahMenu).toHaveBeenCalledWith(expect.anything(), '1');
});
