// ../components/selectors/WordShadeSelector.js
import React from 'react';
import { useWordShade } from '../../contexts/WordShadeContext';
import { useLabels } from '../../hooks/useLabels';

const WordShadeSelector = () => {
  const { wordShadeMode, setWordShadeMode } = useWordShade();
  const t = useLabels();

  const handleChange = (event) => {
    setWordShadeMode(event.target.value);
  };

  return (
    <div className="flex flex-col gap-[10px] py-[10px]">
      <label>{t.wordShadeMode}</label>
      <div className="flex gap-[15px] flex-wrap">
        <label className="flex items-center gap-[5px]">
          <input type="radio" value="none" checked={wordShadeMode === 'none'} onChange={handleChange} />
          {t.none}
        </label>
        <label className="flex items-center gap-[5px]">
          <input type="radio" value="grammatical" checked={wordShadeMode === 'grammatical'} onChange={handleChange} />
          {t.grammatical}
        </label>
        <label className="flex items-center gap-[5px]">
          <input type="radio" value="ontological" checked={wordShadeMode === 'ontological'} onChange={handleChange} />
          {t.ontological}
        </label>
      </div>
    </div>
  );
};

export default WordShadeSelector;
