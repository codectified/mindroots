import React, { useState, useEffect } from 'react';
import { useDisplayMode } from '../../contexts/DisplayModeContext';
import NodesTable from './NodesTable';
import GraphVisualization from './GraphVisualization';
import { fetchRoots, fetchCombinateRoots, fetchExtendedRootsNew } from '../../services/apiService'; // New distinct search functions
import { useLanguage } from '../../contexts/LanguageContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import InfoBubble from '../layout/InfoBubble';
import MiniMenu from '../navigation/MiniMenu';
import { useContextFilter } from '../../contexts/ContextFilterContext';

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
      <MiniMenu />
      <h2>Positional Root Search</h2>

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
{/* Only render the “global” InfoBubble when in graph mode */}
{displayMode === 'graph' && infoBubble && (
  <InfoBubble
    className="info-bubble"
    definition={infoBubble.definition}
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