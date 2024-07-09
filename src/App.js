import React, { useState } from 'react';
import Header from './components/Header';
import Dropdown from './components/Dropdown';
import WordList from './components/WordList';
import Visualization from './components/Visualization';
import { fetchRootData, fetchWordData } from './services/apiService';

const App = () => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [script, setScript] = useState('arabic'); // Default script set to Arabic
  const [rootData, setRootData] = useState(null);
  const [concept, setConcept] = useState('The Most Excellent Names'); // Default concept

  const handleSelectWord = async (word) => {
    setSelectedWord(word);
    try {
      const isRoot = concept === 'Roots';
      const response = isRoot
        ? await fetchRootData(word[script], script)
        : await fetchWordData(word[script], script);
      setRootData(response.data[0]); // Update to access the first object in the array
    } catch (error) {
      console.error('Error fetching root data:', error);
    }
  };

  const handleSwitchScript = () => {
    setScript(script === 'english' ? 'arabic' : 'english');
  };

  const handleSelectConcept = (concept) => {
    setConcept(concept);
    setSelectedWord(null); // Reset selected word when concept changes
    setRootData(null); // Reset root data when concept changes
  };

  return (
    <div>
      <Header script={script} onSwitchScript={handleSwitchScript} />
      <Dropdown onSelect={handleSelectWord} script={script} onSelectConcept={handleSelectConcept} />
      <WordList selectedWord={selectedWord} script={script} concept={concept} />
      <Visualization rootData={rootData} />
    </div>
  );
};

export default App;
