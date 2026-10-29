import { useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RootGame from './RootGame';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';
import { AdvancedModeProvider } from '../../contexts/AdvancedModeContext';
import { fetchRandomNodes, fetchQuranItemsRange, fetchRootWords, expandGraph } from '../../services/apiService';

jest.mock('../../services/apiService', () => ({
  fetchRandomNodes: jest.fn(),
  fetchQuranItemsRange: jest.fn(),
  fetchRootWords: jest.fn(),
  expandGraph: jest.fn(),
}));

// The app's graph state and its d3 views are tested elsewhere
const mockGraph = {
  graphData: { nodes: [], links: [] },
  setGraphData: jest.fn(),
  handleNodeClick: jest.fn(),
  handleContextMenuAction: jest.fn(),
  infoBubble: null,
  setInfoBubble: jest.fn(),
  nodeInspectorData: null,
  setNodeInspectorData: jest.fn(),
  handleNodeNavigation: jest.fn(),
};
jest.mock('../../contexts/GraphDataContext', () => ({
  useGraphData: () => mockGraph,
  normalizeNodes: (nodes) => nodes.map((n) => ({ ...n, type: n.node_type.toLowerCase() })),
}));
jest.mock('../graph/GraphVisualization', () => () => null);
jest.mock('../graph/NodeInspector', () => () => null);
jest.mock('../layout/InfoBubble', () => () => null);

// وَقَوْلِهِمْ (4:156:3): prefix وَ, stem قَوْلِ, suffix هِمْ; root قول, a noun
const item = {
  item_id: '4:156:3', surah_number: 4, ayah_number: 156, root: 'قول', lemma: 'قَوْل', sem: 'وَقَوْلِهِمْ',
  s1_arabic: 'وَ', s1_features: 'PREFIX|w:CONJ+',
  s2_arabic: 'قَوْلِ', s2_features: 'STEM|POS:N|VN|LEM:qawol|ROOT:qwl|M|GEN',
  s3_arabic: 'هِمْ', s3_features: 'SUFFIX|PRON:3MP',
};

// Lane entries as stored on Word.definitions
const LANE = {
  1: '1; قَالَ; ذ; , aor.; يَقُولُ; He said; (S, K;)',
  2: 'قَوْلٌ; ذ; A saying; or speech; (S.)',
  5: '1; كَتَبَهُ; ذ; , aor.; كَتُبَ; He wrote it:; (S, K:)',
};

// Sets the interface language the way the nav's language selector does
const Language = ({ l1, children }) => {
  const { setL1 } = useLanguage();
  // After mount: the provider resets L1 to its default in its own mount effect
  useEffect(() => {
    if (!l1) return undefined;
    const timer = setTimeout(() => setL1(l1), 0);
    return () => clearTimeout(timer);
  }, [l1, setL1]);
  return children;
};

const play = (settings, l1) => {
  localStorage.setItem('rootGameSettings', JSON.stringify(settings));
  render(<AdvancedModeProvider><LanguageProvider><Language l1={l1}><RootGame /></Language></LanguageProvider></AdvancedModeProvider>);
};

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  fetchRandomNodes.mockImplementation(async (type) => ({
    nodes: type === 'word'
      ? [item, { item_id: '4:156:1', sem: 'وَإِذَا' }]
      : [{ root_id: 1, r1: 'ق', r2: 'و', r3: 'ل', arabic: 'ق-و-ل' }, { root_id: 2, r1: 'ك', r2: 'ت', r3: 'ب', arabic: 'ك-ت-ب' }],
  }));
  fetchQuranItemsRange.mockResolvedValue([{ item_id: '4:156:2', arabic: 'وَبِكُفْرِهِمْ' }, { item_id: '4:156:3', arabic: 'وَقَوْلِهِمْ' }]);
  // root-words: the lean list, without Lane entries
  fetchRootWords.mockImplementation(async () => ({
    words: [
      { arabic: 'قَالَ', english: 'Crime', word_id: 1, word_type: 'verb' },
      { arabic: 'قَوْلٌ', english: 'Criminal', word_id: 2, word_type: 'noun' },
    ],
  }));
  expandGraph.mockImplementation(async (from, id, to) => {
    if (from === 'word' && to === 'form') {
      return { nodes: [{ id: `word_${id}`, node_type: 'Word', word_id: id }, { id: 'form_1', node_type: 'Form' }], links: [{ source: `word_${id}`, target: 'form_1' }] };
    }
    if (from === 'word') {
      return {
        nodes: [{ id: `word_${id}`, node_type: 'Word', word_id: id, definitions: LANE[id] }, { id: 'root_1', node_type: 'Root' }],
        links: [{ source: `word_${id}`, target: 'root_1' }],
      };
    }
    return {
      nodes: id === 2
        ? [
          { node_type: 'Root', arabic: 'ك-ت-ب' },
          { node_type: 'Word', arabic: 'كَتَبَ', word_id: 5, word_type: 'verb', itype: '1', definitions: LANE[5] },
          { node_type: 'Word', arabic: 'كَتَّبَ', word_id: 6, word_type: 'verb', itype: '2', definitions: '' },
          { node_type: 'Word', arabic: 'כתב', word_id: 7, word_type: 'verb', itype: '1', definitions: '' },
        ]
        : [
          { node_type: 'Word', arabic: 'قَالَ', word_id: 1, word_type: 'verb', itype: '1', definitions: LANE[1] },
        ],
    };
  });
});

const pressLetters = (letters) => letters.forEach((ch) => fireEvent.click(screen.getByRole('button', { name: ch })));

it('plays a Quran word, skipping particles, and scores a typed root', async () => {
  play({ source: 'quran', level: 'advanced' });
  await waitFor(() => expect(screen.getByTestId('game-word')).toHaveTextContent('وَقَوْلِهِمْ'));
  expect(fetchRandomNodes).toHaveBeenCalledWith('word', 30, { corpus_id: 2 });
  expect(screen.getByRole('heading', { name: 'Find the Root' })).toBeInTheDocument();
  expect(screen.getByText('What is the root of this word?')).toBeInTheDocument();

  pressLetters(['ق', 'و', 'ل']);
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
  expect(screen.getByText('Correct!')).toBeInTheDocument();
  expect(screen.getByText('Score:').parentElement).toHaveTextContent('10');
  // The meaning shows once answered
  expect(await screen.findByText('A saying or speech')).toBeInTheDocument();
});

it('accepts a weak-letter guess as close and charges for hints', async () => {
  play({ source: 'quran', level: 'advanced' });
  await screen.findByTestId('game-word');

  // The meaning is the lemma's Lane entry, not its English gloss
  fireEvent.click(screen.getByRole('button', { name: 'Meaning' }));
  expect(await screen.findByText('A saying or speech')).toBeInTheDocument();
  expect(fetchRootWords).toHaveBeenCalledWith('ق', 'و', 'ل');
  expect(expandGraph).toHaveBeenCalledWith('word', 2, 'root', { L1: 'sem', L2: 'english' });

  fireEvent.click(screen.getByRole('button', { name: 'First letter' }));
  pressLetters(['ا', 'ل']); // قال, as the verb is spelled
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
  expect(screen.getByText(/Close enough/)).toBeInTheDocument();
  expect(screen.getByText('Score:').parentElement).toHaveTextContent('6');
});

it('shows a related word\'s meaning when it is tapped', async () => {
  play({ source: 'quran', level: 'advanced' });
  await screen.findByTestId('game-word');
  fireEvent.click(screen.getByRole('button', { name: 'Related words' }));
  fireEvent.click(await screen.findByRole('button', { name: 'قَالَ' }));
  expect(await screen.findByText('He said')).toBeInTheDocument();
});

it('keeps Form I verbs out of the advanced level', async () => {
  const verb = { item_id: '2:11:6', root: 'قول', lemma: 'قَالَ', sem: 'قَالَ', s1_arabic: 'قَالَ', s1_features: 'STEM|POS:V|PERF|LEM:qaAla|ROOT:qwl|3MS' };
  fetchRandomNodes.mockResolvedValue({ nodes: [verb] });
  play({ source: 'quran', level: 'advanced' });
  expect(await screen.findByText('No words at this level found here.')).toBeInTheDocument();
});

it('keeps weak roots out of the beginner level', async () => {
  play({ source: 'quran', level: 'beginner' });
  expect(await screen.findByText('No words at this level found here.')).toBeInTheDocument();
});

it('scopes Quran words to the chosen surah', async () => {
  play({ source: 'quran', level: 'advanced' });
  await screen.findByTestId('game-word');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '112' } });
  await waitFor(() => expect(fetchRandomNodes).toHaveBeenLastCalledWith('word', 30, { corpus_id: 2, surah_numbers: [112] }));
});

it('plays the whole lexicon from a random root, beginner taking a Form I verb from a sound root', async () => {
  play({});
  await waitFor(() => expect(screen.getByTestId('game-word')).toHaveTextContent('كَتَبَ'));
  expect(fetchRandomNodes).toHaveBeenCalledWith('root', 12, {});
  expect(expandGraph).toHaveBeenCalledTimes(1);
  expect(expandGraph).toHaveBeenCalledWith('root', 2, 'word', { L1: 'sem', L2: 'english', limit: 100 });

  // The meaning hint uses the Lane entries already fetched
  fireEvent.click(screen.getByRole('button', { name: 'Meaning' }));
  expect(await screen.findByText('He wrote it')).toBeInTheDocument();
  expect(expandGraph).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Hide prefixes' })).toBeNull();
});

it('plays longer roots in advanced lexicon mode, by root id', async () => {
  fetchRandomNodes.mockResolvedValue({ nodes: [{ root_id: 99, r1: 'ز', r2: 'ل', r3: 'ز', r4: 'ل', arabic: 'ز-ل-ز-ل' }] });
  expandGraph.mockResolvedValue({
    nodes: [
      { node_type: 'Root', arabic: 'ز-ل-ز-ل' },
      { node_type: 'Word', arabic: 'زَلْزَلَ', word_id: 9, word_type: 'verb', itype: 'Q1' },
    ],
  });
  play({ source: 'lexicon', level: 'advanced' });
  await waitFor(() => expect(screen.getByTestId('game-word')).toHaveTextContent('زَلْزَلَ'));
  expect(expandGraph).toHaveBeenCalledWith('root', 99, 'word', { L1: 'sem', L2: 'english', limit: 100 });
  expect(fetchRootWords).not.toHaveBeenCalled();
  expect(screen.getByText(/4-letter root/)).toBeInTheDocument();
});

it('follows the Arabic interface language: labels, right-to-left, Arabic digits', async () => {
  play({ source: 'quran', level: 'advanced' }, 'arabic');
  await screen.findByTestId('game-word');
  expect(await screen.findByRole('heading', { name: 'اعرف الجذر' })).toBeInTheDocument();
  expect(screen.getByText('ما جذر هذه الكلمة؟')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'اعرف الجذر' }).parentElement).toHaveAttribute('dir', 'rtl');
  expect(screen.getByText('٤:١٥٦:٣')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: '١١٢. الإخلاص' })).toBeInTheDocument();
});

it('opens the word menu once answered, and its minimal graph: word and root', async () => {
  play({ source: 'quran', level: 'advanced' });
  await screen.findByTestId('game-word');
  // Not before answering: the menu would give the root away
  expect(screen.getByTestId('game-word')).not.toHaveAttribute('role');

  fireEvent.click(screen.getByRole('button', { name: 'Show answer' }));
  await waitFor(() => expect(screen.getByTestId('game-word')).toHaveAttribute('role', 'button'));
  fireEvent.click(screen.getByTestId('game-word'));
  expect(await screen.findByRole('button', { name: 'More info' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'View Graph' }));

  expect(await screen.findByTestId('game-graph')).toBeInTheDocument();
  await waitFor(() => expect(mockGraph.setGraphData).toHaveBeenCalled());
  const { nodes, links } = mockGraph.setGraphData.mock.calls[0][0];
  expect(nodes.map((n) => n.id)).toEqual(['word_2', 'root_1']);
  expect(links).toHaveLength(1);
  expect(expandGraph).not.toHaveBeenCalledWith('word', 2, 'form', expect.anything());
});

it('adds the form to the minimal graph in advanced mode, and passes other menu items to the app', async () => {
  localStorage.setItem('advancedMode', 'true');
  play({ source: 'quran', level: 'advanced' });
  await screen.findByTestId('game-word');
  fireEvent.click(screen.getByRole('button', { name: 'Show answer' }));

  await waitFor(() => expect(screen.getByTestId('game-word')).toHaveAttribute('role', 'button'));
  fireEvent.click(screen.getByTestId('game-word'));
  fireEvent.click(await screen.findByRole('button', { name: 'View Graph' }));
  await waitFor(() => expect(mockGraph.setGraphData).toHaveBeenCalled());
  expect(mockGraph.setGraphData.mock.calls[0][0].nodes.map((n) => n.id)).toEqual(['word_2', 'root_1', 'form_1']);

  fireEvent.click(screen.getByTestId('game-word'));
  fireEvent.click(await screen.findByRole('button', { name: 'More info' }));
  expect(mockGraph.handleContextMenuAction).toHaveBeenCalledWith(
    'more-info', expect.objectContaining({ type: 'word', word_id: 2, definitions: LANE[2] }), expect.anything(),
  );
});
