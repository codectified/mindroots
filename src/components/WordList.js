import React, { useEffect, useState } from 'react';
import { fetchRootData } from '../services/apiService';

const WordList = ({ selectedWord, script }) => {
  const [rootData, setRootData] = useState(null);

  useEffect(() => {
    if (selectedWord) {
      fetchRootData(selectedWord, script).then(response => setRootData(response.data));
    }
  }, [selectedWord, script]);

  return (
    <div>
      {rootData && (
        <div>
          <h3>Root: {rootData.root.text}</h3>
          <ul>
            {rootData.words.map(word => (
              <li key={word.text}>{word.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WordList;
