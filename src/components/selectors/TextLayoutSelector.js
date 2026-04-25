// ../components/TextLayoutToggle.js
import React from 'react';
import { useTextLayout } from '../../contexts/TextLayoutContext';
import { useLabels } from '../../hooks/useLabels';

const TextLayoutToggle = () => {
  const { layout, setLayout } = useTextLayout();
  const t = useLabels();

  const handleChange = (event) => {
    setLayout(event.target.value);
  };

  return (
    <div className="flex flex-col gap-[10px] py-[10px]">
      <label>{t.layout}</label>
      <div className="flex flex-col gap-[5px]">
        <label className="flex items-center gap-[5px]">
          <input type="radio" value="prose" checked={layout === 'prose'} onChange={handleChange} />
          {t.prose}
        </label>
        <label className="flex items-center gap-[5px]">
          <input type="radio" value="line-by-line" checked={layout === 'line-by-line'} onChange={handleChange} />
          {t.lineByLine}
        </label>
      </div>
    </div>
  );
};

export default TextLayoutToggle;
