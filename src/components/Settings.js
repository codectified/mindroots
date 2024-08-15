import React from 'react';
import ScriptSelector from './ScriptSelector';
import ContextShiftSelector from './ContextShiftSelector';

const Settings = ({ script, handleScriptChange, contextFilterRoot, contextFilterForm, handleContextFilterChange, corpora }) => {
  return (
    <div>
      <h2>Settings</h2>
      <div>
        <label>Language Settings:</label>
        <ScriptSelector script={script} handleScriptChange={handleScriptChange} />
      </div>
      <div>
        <label>Context Filters:</label>
        <ContextShiftSelector 
          contextFilterRoot={contextFilterRoot}
          contextFilterForm={contextFilterForm}
          handleContextFilterChange={handleContextFilterChange}
          corpora={corpora}
        />
      </div>
    </div>
  );
};

export default Settings;
