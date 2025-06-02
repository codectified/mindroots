import React, { useState } from 'react';
import { useDisplayMode } from '../../contexts/DisplayModeContext';
import NodesTable from './NodesTable';
import GraphVisualization from './GraphVisualization';
import { fetchGeminateRoots, fetchTriliteralRoots, fetchExtendedRoots } from '../../services/apiService'; // Updated service functions
import { useScript } from '../../contexts/ScriptContext';
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
  const { L1, L2 } = useScript();
  const { displayMode } = useDisplayMode();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');
  const [totalRoots, setTotalRoots] = useState(0);

  const closeInfoBubble = () => setInfoBubble(null);

  const handleFetchRoots = async (searchType = 'Triliteral') => {
    try {
      let roots = [];
      let total = 0;

      // Select appropriate service function based on searchType
      if (searchType === 'Geminate') {
        const { roots: geminateRoots, total: geminateTotal } = await fetchGeminateRoots(r1, r2, L1, L2);
        roots = geminateRoots;
        total = geminateTotal;
      } else if (searchType === 'Extended') {
        const { roots: extendedRoots, total: extendedTotal } = await fetchExtendedRoots(r1, r2, r3, L1, L2);
        roots = extendedRoots;
        total = extendedTotal;
      } else {
        const { roots: triliteralRoots, total: triliteralTotal } = await fetchTriliteralRoots(r1, r2, r3, L1, L2);
        roots = triliteralRoots;
        total = triliteralTotal;
      }

      // Format and set graph data
      const formattedData = formatNeo4jData(roots);
      setGraphData(formattedData);
      setTotalRoots(total || roots.length);
    } catch (error) {
      console.error('Error fetching roots:', error);
    }
  };

  const handleCombinate = async () => {
    const combinations = generateCombinations(); // Generate all combinations
    try {
      const responses = await Promise.allSettled(
        combinations.map(async (combo) => {
          try {
            const { roots } = await fetchTriliteralRoots(combo[0], combo[1] || '', combo[2] || '', L1, L2);
            return roots; // Return only the roots for this combination
          } catch (error) {
            console.warn(`No roots found for combination: ${combo.join('-')}`);
            return []; // Return an empty array for failed requests
          }
        })
      );

      const allRoots = responses
        .filter((result) => result.status === 'fulfilled') // Only take fulfilled results
        .map((result) => result.value) // Extract the roots from the result
        .flat(); // Flatten the array

      if (allRoots.length > 0) {
        const formattedData = formatNeo4jData(allRoots);
        setGraphData(formattedData);
        setTotalRoots(allRoots.length);
      } else {
        setGraphData({ nodes: [], links: [] });
        setTotalRoots(0);
      }
    } catch (error) {
      console.error('Error fetching combinations:', error);
    }
  };

  const generateCombinations = () => {
    const letters = [r1, r2, r3].filter(Boolean); // Only include selected letters
    const combos = [];

    const permute = (arr, m = []) => {
      if (arr.length === 0) combos.push(m);
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    };

    permute(letters);
    return combos;
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
      <h2>Root Search</h2>

      {/* Dropdown menus */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <label>R1:</label>
          <select value={r1} onChange={(e) => setR1(e.target.value)}>
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
          <select value={r2} onChange={(e) => setR2(e.target.value)}>
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
          <select value={r3} onChange={(e) => setR3(e.target.value)}>
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button onClick={() => handleFetchRoots(r3 === 'NoR3' ? 'Geminate' : 'Triliteral')}>Fetch Root(s)</button>
        <button onClick={handleCombinate}>Combinate</button>
        <button onClick={() => handleFetchRoots('Extended')}>Fetch Extended</button>
      </div>

      {/* Total roots count */}
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        {totalRoots > 0 && <p>Total Roots Found: {totalRoots} (Showing 25 max)</p>}
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
      {infoBubble && (
        <InfoBubble
          className="info-bubble"
          definition={infoBubble.definition}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
            position: 'absolute',
          }}
        />
      )}
    </div>
  );
};

export default Search;