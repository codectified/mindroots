import React, { useState, useEffect } from 'react';
import { fetchWords, fetchRoots } from '../services/apiService';

const Dropdown = ({ onSelect, script }) => {
  const [column, setColumn] = useState('roots'); // Default column
  const [words, setWords] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response;
        if (column === 'roots') {
          response = await fetchRoots();
        } else {
          response = await fetchWords(column, script);
        }
        console.log('Fetched words:', response.data);
        setWords(response.data);
      } catch (error) {
        console.error('Error fetching words:', error);
      }
    };
    fetchData();
  }, [column, script]);

  return (
    <div>
      <select value={column} onChange={(e) => setColumn(e.target.value)}>
        <option value="roots">Roots</option>
        <option value="infinitive">Infinitive</option>
        <option value="active participle">Active Participle</option>
        {/* Add more options as needed */}
      </select>
      <ul>
        {words.map((word, index) => (
          <li key={index} onClick={() => onSelect(word)}>
            {typeof word === 'object' ? (script === 'english' ? word.english : word.arabic) : word}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dropdown;
