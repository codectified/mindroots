import React from 'react';
import ScriptSelector from './ScriptSelector';
import ContextShiftSelector from './ContextShiftSelector';
import { useScript } from '../contexts/ScriptContext';
import { useContextFilter } from '../contexts/ContextFilterContext';
import { useCorpus } from '../contexts/CorpusContext';

const Settings = () => {
  const { script, setScript } = useScript();
  const { contextFilterRoot, setContextFilterRoot, contextFilterForm, setContextFilterForm } = useContextFilter();
  const { corpora } = useCorpus();

  const handleScriptChange = (newScript) => {
    setScript(newScript);
  };

  const handleContextFilterChange = (event) => {
    const { name, value } = event.target;
    if (name === 'root') {
      setContextFilterRoot(value);
    } else if (name === 'form') {
      setContextFilterForm(value);
    }
  };

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
