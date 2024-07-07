import React, { useState } from 'react';
import Dropdown from './components/Dropdown';
import WordList from './components/WordList';
import Visualization from './components/Visualization';
import { fetchRootData } from './services/apiService';

const App = () => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [script, setScript] = useState('english');

  const handleSelectWord = (word) => {
    setSelectedWord(word);
  };

  const handleSwitchScript = () => {
    setScript(script === 'english' ? 'arabic' : 'english');
  };

  return (
    <div>
      <header>
        <h1>Mind Roots</h1>
        <button onClick={handleSwitchScript}>
          Switch to {script === 'english' ? 'Arabic' : 'English'}
        </button>
      </header>
      <Dropdown onSelect={handleSelectWord} />
      <WordList selectedWord={selectedWord} script={script} />
      <Visualization rootData={selectedWord ? fetchRootData(selectedWord, script) : null} />
    </div>
  );
};

export default App;
