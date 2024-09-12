import React, { useState } from 'react';
import GraphVisualization from './GraphVisualization';
import { fetchRootByLetters } from '../services/apiService';

const arabicLetters = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", 
  "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"
];

const Sandbox = () => {
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [r3, setR3] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const handleFetchRoot = async () => {
    try {
      const rootsData = await fetchRootByLetters(r1, r2, r3);
      const rootNodes = rootsData.map(rootData => ({
        id: `root_${rootData.root_id}`,
        label: rootData.arabic,
        ...rootData,
        type: 'root',
      }));

      setGraphData({
        nodes: rootNodes,
        links: [] // You can expand this to show more relationships if needed
      });
    } catch (error) {
      console.error('Error fetching root:', error);
    }
  };

  return (
    <div className="sandbox-container">
      <h2>Sandbox Mode</h2>
      
      {/* Arabic letter dropdowns */}
      <div>
        <select value={r1} onChange={(e) => setR1(e.target.value)}>
          <option value="">Select R1</option>
          {arabicLetters.map(letter => (
            <option key={letter} value={letter}>{letter}</option>
          ))}
        </select>

        <select value={r2} onChange={(e) => setR2(e.target.value)}>
          <option value="">Select R2</option>
          {arabicLetters.map(letter => (
            <option key={letter} value={letter}>{letter}</option>
          ))}
        </select>

        <select value={r3} onChange={(e) => setR3(e.target.value)}>
          <option value="">Select R3</option>
          {arabicLetters.map(letter => (
            <option key={letter} value={letter}>{letter}</option>
          ))}
        </select>

        <button onClick={handleFetchRoot}>Fetch Root(s)</button>
      </div>

      {/* Render the GraphVisualization component */}
      {graphData.nodes.length > 0 && (
        <GraphVisualization data={graphData} onNodeClick={() => {}} onNodeRightClick={() => {}} />
      )}
    </div>
  );
};

export default Sandbox;