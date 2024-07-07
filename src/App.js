import React, { useState } from 'react';
import Header from './components/Header';
import Dropdown from './components/Dropdown';
import WordList from './components/WordList';
import Visualization from './components/Visualization';
import { fetchRootData } from './services/apiService';

const App = () => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [script, setScript] = useState('arabic');

  const handleSelectWord = (word) => {
    setSelectedWord(word);
  };

  const handleSwitchScript = () => {
    setScript(script === 'english' ? 'arabic' : 'english');
  };

  return (
    <div>
      <Header script={script} onSwitchScript={handleSwitchScript} />
      <Dropdown onSelect={handleSelectWord} script={script} />
      <WordList selectedWord={selectedWord} script={script} />
      <Visualization rootData={selectedWord ? fetchRootData(selectedWord, script) : null} />
    </div>
  );
};

export default App;
