import React, { useEffect, useState } from 'react';
import { fetchRootData, fetchRootDataByRoot } from '../services/apiService';

const WordList = ({ selectedWord, script }) => {
  const [rootData, setRootData] = useState(null);

  useEffect(() => {
    if (selectedWord) {
      const fetchData = async () => {
        try {
          const isRoot = selectedWord.hasOwnProperty('arabic') && selectedWord.hasOwnProperty('english');
          const response = isRoot
            ? await fetchRootDataByRoot(selectedWord[script], script)
            : await fetchRootData(selectedWord[script], script);
          console.log('Fetched root data:', response.data);
          setRootData(response.data);
        } catch (error) {
          console.error('Error fetching root data:', error);
          setRootData(null);
        }
      };
      fetchData();
    }
  }, [selectedWord, script]);

  if (!selectedWord) {
    return <div>Select a word to see the details</div>;
  }

  if (!rootData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h3>Root: {rootData.root && rootData.root[script]}</h3>
      <ul>
        {rootData.words && rootData.words.map((word, index) => (
          <li key={index}>{word[script]}</li>
        ))}
      </ul>
    </div>
  );
};

export default WordList;
