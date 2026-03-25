import React, { useState, useEffect } from 'react';
import { useDisplayMode } from '../../contexts/DisplayModeContext';
import NodesTable from './NodesTable';
import GraphVisualization from './GraphVisualization';
import { fetchRoots, fetchCombinateRoots, fetchExtendedRootsNew, searchFullText } from '../../services/apiService'; // New distinct search functions
import { useLanguage } from '../../contexts/LanguageContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import InfoBubble from '../layout/InfoBubble';
import { useContextFilter } from '../../contexts/ContextFilterContext';
import DisplayModeSelector from '../selectors/DisplayModeSelector';

const arabicLetters = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض',
  'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

const Search = () => {
  const { contextFilterRoot, contextFilterForm } = useContextFilter();
  const { L1, L2 } = useLanguage();
  const { displayMode } = useDisplayMode();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');
  const [totalRoots, setTotalRoots] = useState(0);
  const [resultLimit, setResultLimit] = useState(25);
  const [lastSearchType, setLastSearchType] = useState(null);
  const [lexicalQuery, setLexicalQuery] = useState('');
  const [lexicalSource, setLexicalSource] = useState('lane');
  const [lexicalTotal, setLexicalTotal] = useState(0);

  const closeInfoBubble = () => setInfoBubble(null);

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

  // 1. Fetch Root(s) - Position-specific search with wildcards and "None" support
  const handleFetchRoots = async () => {
    try {
      const { roots, total } = await fetchRoots(r1, r2, r3, L1, L2, resultLimit);
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
      const { roots, total } = await fetchExtendedRootsNew(r1, r2, r3, L1, L2, resultLimit);
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
      const { roots, total } = await fetchCombinateRoots(r1, r2, r3, L1, L2, resultLimit);
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
    if (!lexicalQuery.trim()) return;
    try {
      const source = lexicalSource === 'both' ? null : lexicalSource;
      const { results } = await searchFullText(lexicalQuery.trim(), source, resultLimit);
      // Flatten all matched word nodes across results
      const words = results.flatMap(r => r.matchedWords);
      const nodes = words.map(w => ({
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Advanced Search</h2>
        <DisplayModeSelector />
      </div>

      {/* Full Text Search */}
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Full Text Search</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={lexicalQuery}
            onChange={(e) => setLexicalQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLexicalSearch()}
            placeholder="e.g. love, mercy, fear god"
            style={{ flex: 1, padding: '6px 10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button onClick={handleLexicalSearch} disabled={!lexicalQuery.trim()}>
            Search
          </button>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#444' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input type="radio" name="lexicalSource" value="lane" checked={lexicalSource === 'lane'} onChange={() => setLexicalSource('lane')} />
            Lane's Lexicon
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input type="radio" name="lexicalSource" value="hanswehr" checked={lexicalSource === 'hanswehr'} onChange={() => setLexicalSource('hanswehr')} />
            Hans Wehr
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input type="radio" name="lexicalSource" value="both" checked={lexicalSource === 'both'} onChange={() => setLexicalSource('both')} />
            Both
          </label>
        </div>
        {lexicalTotal > 0 && lastSearchType === 'lexical' && (
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#666' }}>
            Found {lexicalTotal} roots
          </p>
        )}
      </div>

      {/* Root Search */}
      <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Root Search</h3>

      {/* Dropdown menus */}
<div className="button-row" style={{ marginBottom: '10px' }}>
  <div>
    <label>R1:</label>
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
    <label>R2:</label>
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
    <label>R3:</label>
    <select
      className="uniform-select"
      value={r3}
      onChange={(e) => setR3(e.target.value)}
    >
      <option value="">*</option>
      <option value="NoR3">None</option>
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
          Fetch Root(s)
        </button>
        <button 
          onClick={handleCombinate}
          disabled={!r1 && !r2 && !r3}
        >
          Combinate
        </button>
        <button 
          onClick={handleFetchExtended}
          disabled={false}
        >
          Fetch Extended
        </button>
      </div>

      {/* User feedback for search logic */}
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
        <div>🔍 <strong>Fetch Root(s):</strong> Position-specific search {r3 === 'NoR3' ? '(biradical only)' : '(2-3 radicals)'}</div>
        <div>🔀 <strong>Combinate:</strong> All permutations of selected radicals {r3 === 'NoR3' ? '(biradical only)' : ''}</div>
        <div>📈 <strong>Extended:</strong> Only roots with 4+ radicals</div>
        {r1 && (
          <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
            Pattern: {r1 || '*'} - {r2 || '*'} - {r3 === 'NoR3' ? 'None' : (r3 || '*')}
          </div>
        )}
      </div>

      {/* Result limit slider */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <label htmlFor="result-limit" style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Node Limit:
          </label>
          <input
            id="result-limit"
            type="range"
            min="10"
            max="100"
            step="5"
            value={resultLimit}
            onChange={(e) => setResultLimit(Number(e.target.value))}
            style={{
              flex: 1,
              maxWidth: '200px'
            }}
          />
          <span style={{ fontSize: '14px', minWidth: '40px' }}>{resultLimit}</span>
        </div>
        {totalRoots > 0 && (
          <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
            Total Roots Found: {totalRoots} (Showing {Math.min(totalRoots, resultLimit)} of {totalRoots})
          </p>
        )}
      </div>

      {/* Conditionally render GraphVisualization or NodesTable */}
      {displayMode === 'graph' ? (
        <GraphVisualization
          data={graphData}
          onNodeClick={(node, event) =>
            handleNodeClick(node, L1, L2, contextFilterRoot, contextFilterForm, null, event)
          }
        />
      ) : (
        <NodesTable
          graphData={graphData}
          wordShadeMode="grammatical" // Replace with dynamic value if needed
          onNodeClick={(node, event) =>
            handleNodeClick(node, L1, L2, contextFilterRoot, contextFilterForm, null, event)
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