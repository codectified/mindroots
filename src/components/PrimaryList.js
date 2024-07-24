import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrimaryList = ({ names, script, setScript, onSelectName }) => {
  const navigate = useNavigate();

  const handleScriptChange = (event) => {
    setScript(event.target.value);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleNameClick = (name) => {
    onSelectName(name);
    navigate('/graph');
  };

  return (
    <div>
      <button onClick={handleBack}>Back</button>
      <h1>Names of Allah</h1>
      <select value={script} onChange={handleScriptChange}>
        <option value="arabic">Arabic</option>
        <option value="english">English</option>
        <option value="both">Both</option>
      </select>
      <ul>
        {names.map((name, index) => (
          <li key={index} onClick={() => handleNameClick(name)}>
            {script === 'arabic' ? name.arabic : script === 'english' ? name.english : `${name.arabic} / ${name.english}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrimaryList;
