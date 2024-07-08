import React, { useState, useEffect } from 'react';
import { fetchWords, fetchRoots } from '../services/apiService';

const Dropdown = ({ onSelect, script }) => {
  const [concept, setConcept] = useState('roots'); // Default concept
  const [words, setWords] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response;
        if (concept === 'roots') {
          response = await fetchRoots();
        } else {
          response = await fetchWords(concept, script);
        }
        setWords(response.data);
      } catch (error) {
        console.error('Error fetching words:', error);
      }
    };
    fetchData();
  }, [concept, script]);

  return (
    <div>
      <select value={concept} onChange={(e) => setConcept(e.target.value)}>
        <option value="roots">Roots</option>
        <option value="Infinitives">Infinitives</option>
        <option value="Active Participles">Active Participles</option>
        {/* Add more options as needed */}
      </select>
      <ul>
        {words.map((word, index) => (
          <li key={index} onClick={() => onSelect(word)}>
            {script === 'english' ? word.english || word : word.arabic || word}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dropdown;
