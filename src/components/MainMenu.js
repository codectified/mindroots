import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainMenu = () => {
  const navigate = useNavigate();

  const handleSelect = (path) => {
    navigate(path);
  };

  return (
    <div>
      <ul>
        <li onClick={() => handleSelect('/list')}>The Most Excellent Names of Allah</li>
        <li onClick={() => handleSelect('/lexicon')}>Lexicon</li>
        <li onClick={() => handleSelect('/quran')}>Quran</li>
        <li onClick={() => handleSelect('/hadith')}>Hadith</li>
      </ul>
    </div>
  );
};

export default MainMenu;
