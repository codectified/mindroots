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
  const [lexicalSources, setLexicalSources] = useState(['lane']);
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
      // Debounce the search to avoid too many rapid API calls
      const timeoutId = setTimeout(() => {
        switch (lastSearchType) {
          case 'roots':
            handleFetchRoots();
            break;
          case 'combinate':
            handleCombinate();
            break;
          case 'extended':
            handleFetchExtended();
            break;
          case 'lexical':
            handleLexicalSearch();
            break;
          default:
            break;
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultLimit]); // Only depend on resultLimit to avoid infinite loops

  const corpusId = (id) => (id && id !== 'lexicon' ? id : null);
  const surahNumbers = surahFilter && surahFilter.length > 0 ? surahFilter : null;

  // 1. Fetch Root(s) - Position-specific search with wildcards and "None" support
  const handleFetchRoots = async () => {
    try {
      const { roots, total } = await fetchRoots(r1, r2, r3, L1, L2, resultLimit, corpusId(corpusFilter), surahNumbers);
      const formattedData = formatNeo4jData(roots);
      setGraphData(formattedData);
      setTotalRoots(total || roots.length);
      setLastSearchType('roots');
    } catch (error) {
      console.error('Error fetching roots:', error);
      setGraphData({ nodes: [], links: [] });
      setTotalRoots(0);
      setLastSearchType(null);
    }
  };

  // 3. Fetch Extended - Only roots with 4+ radicals
  const handleFetchExtended = async () => {
    try {
      const { roots, total } = await fetchExtendedRootsNew(r1, r2, r3, L1, L2, resultLimit, corpusId(corpusFilter), surahNumbers);
      const formattedData = formatNeo4jData(roots);
      setGraphData(formattedData);
      setTotalRoots(total || roots.length);
      setLastSearchType('extended');
    } catch (error) {
      console.error('Error fetching extended roots:', error);
      setGraphData({ nodes: [], links: [] });
      setTotalRoots(0);
      setLastSearchType(null);
    }
  };

  // 2. Combinate - Return all valid permutations of specified radicals
  const handleCombinate = async () => {
    try {
      const { roots, total } = await fetchCombinateRoots(r1, r2, r3, L1, L2, resultLimit, corpusId(corpusFilter), surahNumbers);
      const formattedData = formatNeo4jData(roots);
      setGraphData(formattedData);
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
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{t.searchTitle}</h2>
          <ContextShiftSelector />
        </div>
        <SurahSelector />
      </div>

      {/* Full Text Search */}
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>{t.fullTextSearch}</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={lexicalQuery}
            onChange={(e) => setLexicalQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLexicalSearch()}
            placeholder={t.fullTextPlaceholder}
            style={{ flex: 1, padding: '6px 10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button onClick={handleLexicalSearch} disabled={!lexicalQuery.trim()}>
            {t.search}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#444' }}>
          {[
            { value: 'lane',     label: t.lanesLexicon },
            { value: 'hanswehr', label: t.hansWehr },
            { value: 'labels',   label: t.wordLabels },
          ].map(({ value, label }) => (
            <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={lexicalSources.includes(value)}
                onChange={() => toggleLexicalSource(value)}
              />
              {label}
            </label>
          ))}
        </div>
        {lexicalTotal > 0 && lastSearchType === 'lexical' && (
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#666' }}>
            {t.foundWords(lexicalTotal)}
          </p>
        )}
      </div>

      {/* Root Search */}
      <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>{t.rootSearch}</h3>

      {/* Dropdown menus */}
<div className="button-row" style={{ marginBottom: '10px' }}>
  <div>
    <label>{t.r1}</label>
    <select
      className="uniform-select"
      value={r1}
      onChange={(e) => setR1(e.target.value)}
    >
      <option value="">*</option>
      {arabicLetters.map((letter) => (
        <option key={letter} value={letter}>
          {letter}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label>{t.r2}</label>
    <select
      className="uniform-select"
      value={r2}
      onChange={(e) => setR2(e.target.value)}
    >
      <option value="">*</option>
      {arabicLetters.map((letter) => (
        <option key={letter} value={letter}>
          {letter}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label>{t.r3}</label>
    <select
      className="uniform-select"
      value={r3}
      onChange={(e) => setR3(e.target.value)}
    >
      <option value="">*</option>
      <option value="NoR3">{t.noR3}</option>
      {arabicLetters.map((letter) => (
        <option key={letter} value={letter}>
          {letter}
        </option>
      ))}
    </select>
  </div>
</div>

      {/* Buttons */}
    <div className="button-row" style={{ marginBottom: '10px' }}>
        <button 
          onClick={handleFetchRoots}
        >
          {t.fetchRoots}
        </button>
        <button
          onClick={handleCombinate}
          disabled={!r1 && !r2 && !r3}
        >
          {t.combinate}
        </button>
      </div>

      {/* User feedback for search logic */}
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
        <div>🔍 <strong>{t.fetchRoots}:</strong> {r3 === 'NoR3' ? t.biradicalOnly : t.twoThreeRadicals}</div>
        <div>🔀 <strong>{t.combinate}:</strong> {r3 === 'NoR3' ? t.biradicalOnly : ''}</div>
        {r1 && (
          <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
            {t.patternLabel} {r1 || '*'} - {r2 || '*'} - {r3 === 'NoR3' ? t.noneLabel : (r3 || '*')}
          </div>
        )}
      </div>

      {/* Result limit slider */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <label htmlFor="result-limit" style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {t.nodeLimit}
          </label>
          <input
            id="result-limit"
            type="range"
            min="10"
            max="100"
            step="5"
            value={resultLimit}
            onChange={(e) => setResultLimit(Number(e.target.value))}
            style={{ flex: 1, maxWidth: '200px' }}
          />
          <span style={{ fontSize: '14px', minWidth: '40px' }}>{resultLimit}</span>
          <DisplayModeSelector size="large" />
          <button
            onClick={handleReset}
            style={{ backgroundColor: '#888', padding: '6px 12px', fontSize: '13px' }}
          >
            {t.reset}
          </button>
        </div>
        {totalRoots > 0 && lastSearchType !== 'lexical' && (
          <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
            {t.totalRoots(Math.min(totalRoots, resultLimit), totalRoots)}
          </p>
        )}
      </div>

      {/* Conditionally render GraphVisualization or NodesTable */}
      {displayMode === 'graph' ? (
        <GraphVisualization
          data={graphData}
          onNodeClick={(node, event) =>
            handleNodeClick(node, L1, L2, event)
          }
        />
      ) : (
        <NodesTable
          graphData={graphData}
          wordShadeMode="grammatical" // Replace with dynamic value if needed
          onNodeClick={(node, event) =>
            handleNodeClick(node, L1, L2, event)
          }
          infoBubble={infoBubble}
          closeInfoBubble={closeInfoBubble}
        />
      )}

      {/* InfoBubble */}
{/* Only render the "global" InfoBubble when in graph mode */}
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