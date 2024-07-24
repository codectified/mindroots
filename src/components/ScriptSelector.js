import React from 'react';

const ScriptSelector = ({ script, handleScriptChange }) => (
  <select value={script} onChange={handleScriptChange}>
    <option value="arabic">Arabic</option>
    <option value="english">English</option>
    <option value="both">Both</option>
  </select>
);

export default ScriptSelector;
