import React from 'react';
import { useScript } from '../../contexts/ScriptContext';

const LanguageSelector = () => {
  const { L1, setL1, L2, setL2, langs } = useScript();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
      {/* Primary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        <label>L1 (Primary):</label>
        <select
          value={L1}
          onChange={e => setL1(e.target.value)}
          disabled={!langs.length}
        >
          {langs.map(lang => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Secondary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        <label>L2 (Secondary):</label>
        <select
          value={L2}
          onChange={e => setL2(e.target.value)}
          disabled={!langs.length}
        >
          <option value="off">Off</option>
          {langs.map(lang => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;