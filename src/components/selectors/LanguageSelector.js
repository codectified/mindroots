import React from 'react';
import { useScript } from '../../contexts/ScriptContext';

const LanguageSelector = () => {
  const { L1, setL1, L2, setL2 } = useScript();

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', rowGap: '2px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          <label>L1 (Primary Language):</label>
          <select value={L1} onChange={(e) => setL1(e.target.value)} style={{ margin: 0 }}>
            <option value="arabic">Arabic</option>
            <option value="english">English</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
          <label>L2:</label>
          <select value={L2} onChange={(e) => setL2(e.target.value)} style={{ margin: 0 }}>
            <option value="off">Off</option>
            <option value="arabic">Arabic</option>
            <option value="english">English</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;