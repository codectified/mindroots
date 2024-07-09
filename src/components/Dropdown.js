import React, { useState, useEffect } from 'react';
import { fetchWords } from '../services/apiService';

const Dropdown = ({ onSelect, script, onSelectConcept }) => {
  const [concept, setConcept] = useState('The Most Excellent Names'); // Default concept
  const [words, setWords] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchWords(concept, script);
        setWords(response.data);
      } catch (error) {
        console.error('Error fetching words:', error);
      }
    };
    fetchData();
  }, [concept, script]);

  const handleConceptChange = (e) => {
    const newConcept = e.target.value;
    setConcept(newConcept);
    onSelectConcept(newConcept);
  };

  return (
    <div>
      <select value={concept} onChange={handleConceptChange}>
        <option value="Roots">Roots</option>
        <option value="Infinitives">Infinitives</option>
        <option value="Active Participles">Active Participles</option>
        <option value="Passive Participles">Passive Participles</option>
        <option value="Nouns of Place">Nouns of Place</option>
        <option value="Singulars">Singulars</option>
        <option value="Nouns of State">Nouns of State</option>
        <option value="Nouns of Instrumentation">Nouns of Instrumentation</option>
        <option value="Nouns of Essence">Nouns of Essence</option>
        <option value="Nouns of Hyperbole">Nouns of Hyperbole</option>
        <option value="The Most Excellent Names">The Most Excellent Names</option>
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
