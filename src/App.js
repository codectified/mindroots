import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WordList from './components/WordList';
import Visualization from './components/Visualization';
import { fetchWords, fetchRootData } from './services/apiService';

const App = () => {
  const [selectedName, setSelectedName] = useState(null);
  const [script, setScript] = useState('arabic'); // Default script set to Arabic
  const [names, setNames] = useState([]);
  const [rootData, setRootData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchWords('The Most Excellent Names', script);
        setNames(response.data);
      } catch (error) {
        console.error('Error fetching names:', error);
      }
    };
    fetchData();
  }, [script]);

  const handleSelectName = async (name) => {
    setSelectedName(name);
    try {
      const response = await fetchRootData(name[script], script);
      setRootData(response.data);
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
      <div style={{ height: '200px', overflowY: 'scroll' }}>
        <ul>
          {names.map((name, index) => (
            <li key={index} onClick={() => handleSelectName(name)}>
              {script === 'english' ? name.english : name.arabic}
            </li>
          ))}
        </ul>
      </div>
      <WordList selectedWord={selectedName} script={script} />
      <Visualization rootData={rootData} />
    </div>
  );
};

export default App;
