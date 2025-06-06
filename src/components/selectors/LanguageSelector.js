import React from 'react';
import { useScript } from '../../contexts/ScriptContext';

const LanguageSelector = () => {
  const { L1, setL1, L2, setL2 } = useScript();

  return (
    <div>
      <div className="selector-row">
        <div className="selector-pair">
          <label>L1 (Primary Language):</label>
          <select
            className="uniform-select"
            value={L1}
            onChange={(e) => setL1(e.target.value)}
          >
            <option value="arabic">Arabic</option>
            <option value="english">English</option>
          </select>
        </div>

        <div className="selector-pair">
          <label>L2:</label>
          <select
            className="uniform-select"
            value={L2}
            onChange={(e) => setL2(e.target.value)}
          >
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