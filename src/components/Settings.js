import React from 'react';
import ContextShiftSelector from './ContextShiftSelector';
import { useScript } from '../contexts/ScriptContext';
import { useContextFilter } from '../contexts/ContextFilterContext';
import { useCorpus } from '../contexts/CorpusContext';

const Settings = () => {
  const { L1, setL1, L2, setL2 } = useScript(); // Use L1 and L2 from ScriptContext
  const { contextFilterRoot, setContextFilterRoot, contextFilterForm, setContextFilterForm } = useContextFilter();
  const { corpora } = useCorpus();

  const handleL1Change = (newL1) => {
    setL1(newL1);
  };

  const handleL2Change = (newL2) => {
    setL2(newL2);
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
        <label>Primary Language (L1):</label>
        <select value={L1} onChange={(e) => handleL1Change(e.target.value)}>
          <option value="arabic">Arabic</option>
          <option value="english">English</option>
        </select>
      </div>
      <div>
        <label>Secondary Language (L2):</label>
        <select value={L2} onChange={(e) => handleL2Change(e.target.value)}>
          <option value="off">Off</option>
          <option value="arabic">Arabic</option>
          <option value="english">English</option>
        </select>
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
