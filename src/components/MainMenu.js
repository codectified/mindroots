import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCorpus } from './CorpusContext';

const MainMenu = () => {
  const navigate = useNavigate();
  const { setSelectedCorpus } = useCorpus();

  const handleSelect = (path, corpusId) => {
    setSelectedCorpus(corpusId);
    navigate(path);
  };

  return (
    <div>
      <ul>
        <li onClick={() => handleSelect('/list', 1)}>The Most Excellent Names of Allah</li>
        <li onClick={() => handleSelect('/list', null)}>Lexicon</li>
        <li onClick={() => handleSelect('/list', 2)}>Quran</li>
        <li onClick={() => handleSelect('/list', 3)}>Hadith</li>
      </ul>
    </div>
  );
};

export default MainMenu;
