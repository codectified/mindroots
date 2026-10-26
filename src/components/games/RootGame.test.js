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

// وَقَالُوا (2:11:6): prefix وَ, stem قَالُ, suffix وا; root قول
const item = {
  item_id: '2:11:6', surah_number: 2, ayah_number: 11, root: 'قول', lemma: 'قَالَ', sem: 'وَقَالُوا',
  s1_arabic: 'وَ', s1_features: 'PREFIX|w:CONJ+',
  s2_arabic: 'قَالُ', s2_features: 'STEM|POS:V|PERF|LEM:qaAla|ROOT:qwl|3MP',
  s3_arabic: 'وا', s3_features: 'SUFFIX|PRON:3MP',
};

beforeEach(() => {
  fetchRandomNodes.mockImplementation(async (type) => ({
    nodes: type === 'word' ? [item, { item_id: '2:11:1', sem: 'وَإِذَا' }] : [],
  }));
  fetchQuranItemsRange.mockResolvedValue([{ item_id: '2:11:5', arabic: 'لَهُمْ' }, { item_id: '2:11:6', arabic: 'وَقَالُوا' }]);
  fetchRootWords.mockResolvedValue({ words: [{ arabic: 'قَالَ', english: 'to say', word_id: 1 }, { arabic: 'قَوْل', english: 'saying', word_id: 2 }] });
});

const pressLetters = (letters) => letters.forEach((ch) => fireEvent.click(screen.getByRole('button', { name: ch })));

it('plays a rooted word, skipping particles, and scores a typed root', async () => {
  render(<AdvancedModeProvider><LanguageProvider><RootGame /></LanguageProvider></AdvancedModeProvider>);
  await waitFor(() => expect(screen.getByTestId('game-word')).toHaveTextContent('وَقَالُوا'));
  expect(fetchRandomNodes).toHaveBeenCalledWith('word', 8, { corpus_id: 2 });

  pressLetters(['ق', 'و', 'ل']);
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
  expect(screen.getByText('Correct!')).toBeInTheDocument();
  expect(screen.getByText('Score:').parentElement).toHaveTextContent('10');
});

it('accepts a weak-letter guess as close and charges for hints', async () => {
  render(<AdvancedModeProvider><LanguageProvider><RootGame /></LanguageProvider></AdvancedModeProvider>);
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

it('scopes words to the chosen surah', async () => {
  render(<AdvancedModeProvider><LanguageProvider><RootGame /></LanguageProvider></AdvancedModeProvider>);
  await screen.findByTestId('game-word');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '112' } });
  await waitFor(() => expect(fetchRandomNodes).toHaveBeenLastCalledWith('word', 8, { corpus_id: 2, surah_numbers: [112] }));
});
