import React, { useState } from 'react';
import GraphVisualization from '../components/GraphVisualization';
import { fetchRootByLetters } from '../services/apiService'; // Your service function to fetch roots
import { useScript } from '../contexts/ScriptContext';
import { useGraphData } from '../contexts/GraphDataContext';
import InfoBubble from './InfoBubble';
import Menu from '../components/Menu';


// Arabic letters array for the dropdowns
const arabicLetters = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 
  'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

const Sandbox = () => {
  const { L1, L2 } = useScript();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');

  const closeInfoBubble = () => {
    setInfoBubble(null);
  };

  const handleFetchRoots = async () => {
    try {
      const roots = await fetchRootByLetters(r1, r2, r3, L1, L2); // Fetching roots with L1 for Arabic labels
      const formattedData = formatNeo4jData(roots);
      setGraphData(formattedData);
    } catch (error) {
      console.error('Error fetching roots:', error);
    }
  };
  const formatNeo4jData = (neo4jData) => {
    const nodes = [];
    const links = [];
  
    neo4jData.forEach(root => {
      // Display only Arabic if L2 is 'off'
      const label = root[L1] ? (L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`) : 'Unknown Label';
  
      nodes.push({
        id: `${root[L1] || root.root_id}_${root.root_id}`, // Fallback to root_id if root[L1] is undefined
        label, // Use the formatted label based on L1 and L2 settings
        root_id: root.root_id,
        type: 'root',
        ...root
      });
    });
  
    return { nodes, links };
  };

  return (
    <div>
            <Menu />
      <div>
        <label>R1:</label>
        <select value={r1} onChange={(e) => setR1(e.target.value)}>
          <option value="">--</option> {/* Empty option for optional selection */}
          {arabicLetters.map(letter => (
            <option key={letter} value={letter}>
              {letter}
            </option>
          ))}
        </select>

        <label>R2:</label>
        <select value={r2} onChange={(e) => setR2(e.target.value)}>
          <option value="">--</option>
          {arabicLetters.map(letter => (
            <option key={letter} value={letter}>
              {letter}
            </option>
          ))}
        </select>

        <label>R3:</label>
        <select value={r3} onChange={(e) => setR3(e.target.value)}>
          <option value="">--</option>
          {arabicLetters.map(letter => (
            <option key={letter} value={letter}>
              {letter}
            </option>
          ))}
        </select>

        <button onClick={handleFetchRoots}>Fetch Roots</button>
      </div>

      <GraphVisualization
        data={graphData}
        onNodeClick={(node, event) => handleNodeClick(node, L1, null, null, null, null, event)}
      />
      
      {infoBubble && (
        <InfoBubble
          className="info-bubble"
          definition={infoBubble.definition}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
            position: 'absolute', // Ensure it's absolutely positioned in the DOM
          }}
        />
      )}
    </div>
  );
};

export default Sandbox;