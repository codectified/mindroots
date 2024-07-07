import React, { useState } from 'react';
import Header from './components/Header';
import Dropdown from './components/Dropdown';
import WordList from './components/WordList';
import Visualization from './components/Visualization';
import { fetchRootData, fetchRootDataByRoot } from './services/apiService';

const App = () => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [script, setScript] = useState('arabic'); // Default script set to Arabic
  const [rootData, setRootData] = useState(null);

  const handleSelectWord = async (word) => {
    setSelectedWord(word);
    try {
      console.log('Selected word:', word); // Debugging line
      const isRoot = word.hasOwnProperty('arabic') && word.hasOwnProperty('english');
      const response = isRoot
        ? await fetchRootDataByRoot(word[script], script)
        : await fetchRootData(word[script], script);
      setRootData(response.data);
      console.log('Fetched root data:', response.data); // Debugging line
    } catch (error) {
      console.error('Error fetching root data:', error);
    }
  };

  const handleSwitchScript = () => {
    setScript(script === 'english' ? 'arabic' : 'english');
  };

  return (
    <div>
      <Header script={script} onSwitchScript={handleSwitchScript} />
      <Dropdown onSelect={handleSelectWord} script={script} />
      <WordList selectedWord={selectedWord} script={script} />
      <Visualization rootData={rootData} />
    </div>
  );
};

export default App;
