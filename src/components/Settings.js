import React from 'react';
import ContextShiftSelector from './ContextShiftSelector';
import { useScript } from '../contexts/ScriptContext';

const Settings = () => {
  const { L1, setL1, L2, setL2 } = useScript();

  return (
    <div>
      <h2>Settings</h2>
      <div>
        <label>Primary Language (L1):</label>
        <select value={L1} onChange={(e) => setL1(e.target.value)}>
          <option value="arabic">Arabic</option>
          <option value="english">English</option>
        </select>
      </div>
      <div>
        <label>Secondary Language (L2):</label>
        <select value={L2} onChange={(e) => setL2(e.target.value)}>
          <option value="off">Off</option>
          <option value="arabic">Arabic</option>
          <option value="english">English</option>
        </select>
      </div>
      <div>
        <label>Context Filters:</label>
        <ContextShiftSelector />
      </div>
    </div>
  );
};

export default Settings;
