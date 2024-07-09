import React, { useEffect, useState } from 'react';
import { fetchRootData, fetchWordData } from '../services/apiService';

const WordList = ({ selectedWord, script, concept }) => {
  const [rootData, setRootData] = useState(null);

  useEffect(() => {
    if (selectedWord) {
      const fetchData = async () => {
        try {
          const isRoot = concept === 'Roots';
          const response = isRoot
            ? await fetchRootData(selectedWord[script], script)
            : await fetchWordData(selectedWord[script], script);
          console.log('Fetched root data:', response.data);
          setRootData(response.data[0]); // Assuming response.data is an array and we need the first item
        } catch (error) {
          console.error('Error fetching root data:', error);
          setRootData(null);
        }
      };
      fetchData();
    }
  }, [selectedWord, script, concept]);

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
