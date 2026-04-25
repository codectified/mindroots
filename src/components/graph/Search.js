import React, { useState, useEffect } from 'react';
import { useDisplayMode } from '../../contexts/DisplayModeContext';
import NodesTable from './NodesTable';
import GraphVisualization from './GraphVisualization';
import { fetchRoots, fetchCombinateRoots, fetchExtendedRootsNew, searchFullText } from '../../services/apiService'; // New distinct search functions
import { useLanguage } from '../../contexts/LanguageContext';
import { useLabels } from '../../hooks/useLabels';
import { useGraphData } from '../../contexts/GraphDataContext';
import InfoBubble from '../layout/InfoBubble';
import { useCorpusFilter } from '../../contexts/CorpusFilterContext';
import DisplayModeSelector from '../selectors/DisplayModeSelector';
import ContextShiftSelector from '../selectors/ContextShiftSelector';
import SurahSelector from '../selectors/SurahSelector';

const arabicLetters = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض',
  'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

const selectClass = 'py-[5px] px-2 text-base font-serif min-w-[120px] border border-border rounded bg-white text-ink appearance-none focus:outline-none focus:border-muted';

const Search = () => {
  const { corpusFilter, surahFilter } = useCorpusFilter();
  const { L1, L2 } = useLanguage();
  const t = useLabels();
  const { displayMode } = useDisplayMode();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');
  const [totalRoots, setTotalRoots] = useState(0);
  const [resultLimit, setResultLimit] = useState(25);
  const [lastSearchType, setLastSearchType] = useState(null);
  const [lexicalQuery, setLexicalQuery] = useState('');
  const [lexicalSources, setLexicalSources] = useState(['lane', 'hanswehr']);
  const [lexicalTotal, setLexicalTotal] = useState(0);

  const closeInfoBubble = () => setInfoBubble(null);

  const handleReset = () => {
    setGraphData({ nodes: [], links: [] });
    setTotalRoots(0);
    setLexicalTotal(0);
    setLastSearchType(null);
    setInfoBubble(null);
  };

  // Auto re-run search when result limit changes
  useEffect(() => {
    if (lastSearchType && totalRoots > 0) {
      const timeoutId = setTimeout(() => {
        switch (lastSearchType) {
          case 'roots':    handleFetchRoots();    break;
          case 'combinate': handleCombinate();   break;
          case 'extended':  handleFetchExtended(); break;
          case 'lexical':   handleLexicalSearch(); break;
          default: break;
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultLimit]);

  const corpusId = (id) => (id && id !== 'lexicon' ? id : null);
  const surahNumbers = surahFilter && surahFilter.length > 0 ? surahFilter : null;

  const handleFetchRoots = async () => {
    try {
      const { roots, total } = await fetchRoots(r1, r2, r3, L1, L2, resultLimit, corpusId(corpusFilter), surahNumbers);
      setGraphData(formatNeo4jData(roots));
      setTotalRoots(total || roots.length);
      setLastSearchType('roots');
    } catch (error) {
      console.error('Error fetching roots:', error);
      setGraphData({ nodes: [], links: [] });
      setTotalRoots(0);
      setLastSearchType(null);
    }
  };

  const handleFetchExtended = async () => {
    try {
      const { roots, total } = await fetchExtendedRootsNew(r1, r2, r3, L1, L2, resultLimit, corpusId(corpusFilter), surahNumbers);
      setGraphData(formatNeo4jData(roots));
      setTotalRoots(total || roots.length);
      setLastSearchType('extended');
    } catch (error) {
      console.error('Error fetching extended roots:', error);
      setGraphData({ nodes: [], links: [] });
      setTotalRoots(0);
      setLastSearchType(null);
    }
  };

  const handleCombinate = async () => {
    try {
      const { roots, total } = await fetchCombinateRoots(r1, r2, r3, L1, L2, resultLimit, corpusId(corpusFilter), surahNumbers);
      setGraphData(formatNeo4jData(roots));
      setTotalRoots(total || roots.length);
      setLastSearchType('combinate');
    } catch (error) {
      console.error('Error fetching combinate roots:', error);
      setGraphData({ nodes: [], links: [] });
      setTotalRoots(0);
      setLastSearchType(null);
    }
  };

  const handleLexicalSearch = async () => {
    if (!lexicalQuery.trim() || lexicalSources.length === 0) return;
    try {
      const { results } = await searchFullText(lexicalQuery.trim(), lexicalSources, resultLimit, corpusId(corpusFilter), surahNumbers);
      const nodes = results.map(({ word: w }) => ({
        id: `word_${w.word_id}`,
        label: L2 === 'off' ? (w[L1] || w.english) : `${w[L1] || w.english} / ${w[L2] || ''}`,
        word_id: w.word_id,
        root_id: w.root_id,
        type: 'word',
        ...w
      }));
      setGraphData({ nodes, links: [] });
      setLexicalTotal(nodes.length);
      setTotalRoots(nodes.length);
      setLastSearchType('lexical');
    } catch (error) {
      console.error('Error in lexical search:', error);
      setGraphData({ nodes: [], links: [] });
      setLexicalTotal(0);
    }
  };

  const toggleLexicalSource = (src) => {
    setLexicalSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  };

  const toggleDictionarySources = () => {
    const hasDictionary = lexicalSources.includes('lane') || lexicalSources.includes('hanswehr');
    if (hasDictionary) {
      setLexicalSources(prev => prev.filter(s => s !== 'lane' && s !== 'hanswehr'));
    } else {
      setLexicalSources(prev => [...prev, 'lane', 'hanswehr']);
    }
  };

  const formatNeo4jData = (neo4jData) => {
    const nodes = [];
    const links = [];
    neo4jData.forEach(root => {
      const label = root[L1] ? (L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`) : 'Unknown Label';
      nodes.push({
        id: `${root[L1] || root.root_id}_${root.root_id}`,
        label,
        root_id: root.root_id,
        type: 'root',
        ...root
      });
    });
    return { nodes, links };
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h2 className="m-0">{t.searchTitle}</h2>
          <ContextShiftSelector />
        </div>
        <SurahSelector />
      </div>

      {/* Full Text Search */}
      <div className="mb-5 pb-4 border-b border-[#e0e0e0]">
        <h3 className="mb-2 text-sm font-bold">{t.fullTextSearch}</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={lexicalQuery}
            onChange={(e) => setLexicalQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLexicalSearch()}
            placeholder={t.fullTextPlaceholder}
            className="flex-1 px-[10px] py-[6px] text-sm border border-border rounded"
          />
          <button onClick={handleLexicalSearch} disabled={!lexicalQuery.trim()}>
            {t.search}
          </button>
        </div>
        <div className="flex gap-4 text-dynamic-sm text-[#444]">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={lexicalSources.includes('lane') || lexicalSources.includes('hanswehr')}
              onChange={toggleDictionarySources}
            />
            {t.dictionaryEntries}
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={lexicalSources.includes('labels')}
              onChange={() => toggleLexicalSource('labels')}
            />
            {t.wordLabels}
          </label>
        </div>
        {lexicalTotal > 0 && lastSearchType === 'lexical' && (
          <p className="mt-1.5 mb-0 text-xs text-muted">
            {t.foundWords(lexicalTotal)}
          </p>
        )}
      </div>

      {/* Root Search */}
      <h3 className="mb-2 text-sm font-bold">{t.rootSearch}</h3>

      {/* Radical dropdowns */}
      <div className="flex flex-wrap gap-5 items-center mb-2.5">
        <div>
          <label>{t.r1}</label>
          <select className={selectClass} value={r1} onChange={(e) => setR1(e.target.value)}>
            <option value="">*</option>
            {arabicLetters.map((letter) => <option key={letter} value={letter}>{letter}</option>)}
          </select>
        </div>
        <div>
          <label>{t.r2}</label>
          <select className={selectClass} value={r2} onChange={(e) => setR2(e.target.value)}>
            <option value="">*</option>
            {arabicLetters.map((letter) => <option key={letter} value={letter}>{letter}</option>)}
          </select>
        </div>
        <div>
          <label>{t.r3}</label>
          <select className={selectClass} value={r3} onChange={(e) => setR3(e.target.value)}>
            <option value="">*</option>
            <option value="NoR3">{t.noR3}</option>
            {arabicLetters.map((letter) => <option key={letter} value={letter}>{letter}</option>)}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-5 items-center mb-2.5">
        <button onClick={handleFetchRoots}>{t.fetchRoots}</button>
        <button onClick={handleCombinate} disabled={!r1 && !r2 && !r3}>{t.combinate}</button>
      </div>

      {/* Search logic feedback */}
      <div className="mb-2.5 text-xs text-muted">
        <div>🔍 <strong>{t.fetchRoots}:</strong> {r3 === 'NoR3' ? t.biradicalOnly : ''}</div>
        <div>🔀 <strong>{t.combinate}:</strong> {r3 === 'NoR3' ? t.biradicalOnly : ''}</div>
        {r1 && (
          <div className="mt-[5px] italic">
            {t.patternLabel} {r1 || '*'} - {r2 || '*'} - {r3 === 'NoR3' ? t.noneLabel : (r3 || '*')}
          </div>
        )}
      </div>

      {/* Result limit */}
      <div className="mb-[15px]">
        <div className="flex items-center gap-2.5 mb-[5px]">
          <label htmlFor="result-limit" className="text-sm font-bold">{t.nodeLimit}</label>
          <input
            id="result-limit"
            type="range"
            min="10"
            max="100"
            step="5"
            value={resultLimit}
            onChange={(e) => setResultLimit(Number(e.target.value))}
            className="flex-1 max-w-[200px]"
          />
          <span className="text-sm min-w-[40px]">{resultLimit}</span>
          <DisplayModeSelector size="large" />
          <button onClick={handleReset} className="bg-[#888] py-[6px] px-3 text-dynamic-sm">
            {t.reset}
          </button>
        </div>
        {totalRoots > 0 && lastSearchType !== 'lexical' && (
          <p className="m-0 text-xs text-muted">
            {t.totalRoots(Math.min(totalRoots, resultLimit), totalRoots)}
          </p>
        )}
      </div>

      {/* Graph or Table */}
      {displayMode === 'graph' ? (
        <GraphVisualization
          data={graphData}
          onNodeClick={(node, event) => handleNodeClick(node, L1, L2, event)}
        />
      ) : (
        <NodesTable
          graphData={graphData}
          wordShadeMode="grammatical"
          onNodeClick={(node, event) => handleNodeClick(node, L1, L2, event)}
          infoBubble={infoBubble}
          closeInfoBubble={closeInfoBubble}
        />
      )}

      {displayMode === 'graph' && infoBubble && (
        <InfoBubble
          className="info-bubble"
          nodeData={infoBubble.nodeData || { definitions: infoBubble.definition }}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
          }}
        />
      )}
    </div>
  );
};

export default Search;
