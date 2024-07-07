import React from 'react';

const Header = ({ script, onSwitchScript }) => {
  return (
    <header>
      <h1>Mind Roots</h1>
      <button onClick={onSwitchScript}>
        Switch to {script === 'english' ? 'Arabic' : 'English'}
      </button>
    </header>
  );
};

export default Header;
