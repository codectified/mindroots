import React from 'react';

const NameSelector = ({ namesOfAllah, script, handleNameChange }) => (
  <select onChange={handleNameChange}>
    {namesOfAllah.map(name => (
      <option key={name.name_id} value={name.name_id}>
        {script === 'both' ? `${name.arabic} / ${name.english}` : name[script]}
      </option>
    ))}
  </select>
);

export default NameSelector;
