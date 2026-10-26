import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RootGame from './RootGame';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { AdvancedModeProvider } from '../../contexts/AdvancedModeContext';
import { fetchRandomNodes, fetchQuranItemsRange, fetchRootWords } from '../../services/apiService';

jest.mock('../../services/apiService', () => ({
  fetchRandomNodes: jest.fn(),
  fetchQuranItemsRange: jest.fn(),
  fetchRootWords: jest.fn(),
}));

// وَقَالُوا (2:11:6): prefix وَ, stem قَالُ, suffix وا; root قول (the و drops)
const item = {
  item_id: '2:11:6', surah_number: 2, ayah_number: 11, root: 'قول', lemma: 'قَالَ', sem: 'وَقَالُوا',
  s1_arabic: 'وَ', s1_features: 'PREFIX|w:CONJ+',
  s2_arabic: 'قَالُ', s2_features: 'STEM|POS:V|PERF|LEM:qaAla|ROOT:qwl|3MP',
  s3_arabic: 'وا', s3_features: 'SUFFIX|PRON:3MP',
};

const play = (settings) => {
  localStorage.setItem('rootGameSettings', JSON.stringify(settings));
  render(<AdvancedModeProvider><LanguageProvider><RootGame /></LanguageProvider></AdvancedModeProvider>);
};

beforeEach(() => {
  localStorage.clear();
  fetchRandomNodes.mockImplementation(async (type) => ({
    nodes: type === 'word'
      ? [item, { item_id: '2:11:1', sem: 'وَإِذَا' }]
      : [{ r1: 'ق', r2: 'و', r3: 'ل', arabic: 'ق-و-ل' }, { r1: 'ك', r2: 'ت', r3: 'ب', arabic: 'ك-ت-ب' }],
  }));
  fetchQuranItemsRange.mockResolvedValue([{ item_id: '2:11:5', arabic: 'لَهُمْ' }, { item_id: '2:11:6', arabic: 'وَقَالُوا' }]);
  fetchRootWords.mockImplementation(async (r1) => ({
    words: r1 === 'ق'
      ? [{ arabic: 'قَالَ', english: 'to say', word_id: 1, word_type: 'verb' }, { arabic: 'قَوْلٌ', english: 'saying', word_id: 2, word_type: 'noun' }]
      : [{ arabic: 'كَتَبَ', english: 'wrote', word_id: 5, word_type: 'verb' }, { arabic: 'כתב', english: 'write', word_id: 7, word_type: 'verb' }],
  }));
});

const pressLetters = (letters) => letters.forEach((ch) => fireEvent.click(screen.getByRole('button', { name: ch })));

it('plays a Quran word, skipping particles, and scores a typed root', async () => {
  play({ source: 'quran', level: 'advanced' });
  await waitFor(() => expect(screen.getByTestId('game-word')).toHaveTextContent('وَقَالُوا'));
  expect(fetchRandomNodes).toHaveBeenCalledWith('word', 12, { corpus_id: 2 });

  pressLetters(['ق', 'و', 'ل']);
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
  expect(screen.getByText('Correct!')).toBeInTheDocument();
  expect(screen.getByText('Score:').parentElement).toHaveTextContent('10');
});

it('accepts a weak-letter guess as close and charges for hints', async () => {
  play({ source: 'quran', level: 'advanced' });
  await screen.findByTestId('game-word');

  fireEvent.click(screen.getByRole('button', { name: 'Meaning' }));
  await waitFor(() => expect(screen.getByText('to say')).toBeInTheDocument());
  expect(fetchRootWords).toHaveBeenCalledWith('ق', 'و', 'ل');

  fireEvent.click(screen.getByRole('button', { name: 'First letter' }));
  pressLetters(['ا', 'ل']); // قال, as the word is spelled
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
  expect(screen.getByText(/Close enough/)).toBeInTheDocument();
  expect(screen.getByText('Score:').parentElement).toHaveTextContent('6');
});

it('keeps hidden-letter words out of the beginner level', async () => {
  play({ source: 'quran', level: 'beginner' });
  expect(await screen.findByText('No words at this level found here.')).toBeInTheDocument();
});

it('scopes Quran words to the chosen surah', async () => {
  play({ source: 'quran', level: 'advanced' });
  await screen.findByTestId('game-word');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '112' } });
  await waitFor(() => expect(fetchRandomNodes).toHaveBeenLastCalledWith('word', 12, { corpus_id: 2, surah_numbers: [112] }));
});

it('plays the whole lexicon from a random root, beginner skipping weak roots', async () => {
  play({});
  await waitFor(() => expect(screen.getByTestId('game-word')).toHaveTextContent('كَتَبَ'));
  expect(fetchRandomNodes).toHaveBeenCalledWith('root', 12, {});
  expect(fetchRootWords).toHaveBeenCalledTimes(1);
  expect(fetchRootWords).toHaveBeenCalledWith('ك', 'ت', 'ب');

  // The meaning hint uses the word list already fetched
  fireEvent.click(screen.getByRole('button', { name: 'Meaning' }));
  expect(screen.getByText('wrote')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Hide prefixes' })).toBeNull();
});
