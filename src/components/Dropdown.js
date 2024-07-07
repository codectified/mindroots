import React, { useState, useEffect } from 'react';
import { fetchWords, fetchRoots } from '../services/apiService';

const Dropdown = ({ onSelect }) => {
  const [column, setColumn] = useState('roots'); // Default column
  const [script, setScript] = useState('english'); // Default script
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
            {script === 'english' ? word.english : word.arabic}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dropdown;
