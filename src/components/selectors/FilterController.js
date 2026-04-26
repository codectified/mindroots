// ../components/selectors/FilterController.js
import React from 'react';
import { useFilter } from '../../contexts/FilterContext';
import { useWordShade } from '../../contexts/WordShadeContext';
import { useFormFilter } from '../../contexts/FormFilterContext';
import { useLabels } from '../../hooks/useLabels';

const FilterController = () => {
  const { filterWordTypes, toggleWordType, hideFormNodes, toggleHideFormNodes } = useFilter();
  const { wordShadeMode } = useWordShade();
  const { selectedFormClassifications, setSelectedFormClassifications } = useFormFilter();
  const t = useLabels();

  const availableClassifications = ['Grammatical', 'Morphological'];
  const classificationLabels = { Grammatical: t.grammatical, Morphological: t.morphological };
  const typeLabels = { phrase: t.phrase, verb: t.verb, noun: t.noun };

  const handleClassificationToggle = (classification) => {
    if (selectedFormClassifications.includes(classification)) {
      setSelectedFormClassifications(prev => prev.filter(c => c !== classification));
    } else {
      setSelectedFormClassifications(prev => [...prev, classification]);
    }
  };

  const grammaticalColorStyles = { phrase: '#FFCCCC', verb: '#FF6666', noun: '#CC0000', form: '#007bff' };
  const ontologicalColorStyles = { phrase: '#000000', verb: '#000000', noun: '#000000', form: '#007bff' };

  const getColorStyles = (type) => {
    const colorStyles = wordShadeMode === 'grammatical' ? grammaticalColorStyles : ontologicalColorStyles;
    return {
      border: `2px solid ${colorStyles[type]}`,
      backgroundColor: filterWordTypes.includes(type) ? colorStyles[type] : 'transparent',
    };
  };

  return (
    <div className="flex flex-col gap-[10px] py-[10px]">
      <div className="flex flex-col gap-[5px]">
        {['phrase', 'verb', 'noun'].map((type) => (
          <label key={type} className="flex items-center gap-[10px]">
            {/* border/bg computed from wordShadeMode + filterWordTypes — must stay inline */}
            <input
              type="checkbox"
              checked={filterWordTypes.includes(type)}
              onChange={() => toggleWordType(type)}
              style={{
                appearance: 'none',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                cursor: 'pointer',
                ...getColorStyles(type),
              }}
            />
            <span style={{ color: wordShadeMode === 'grammatical' ? grammaticalColorStyles[type] : ontologicalColorStyles[type] }}>
              {typeLabels[type]}
            </span>
          </label>
        ))}

        <div>
          <label className="flex items-center gap-[10px]">
            <input
              type="checkbox"
              checked={!hideFormNodes}
              onChange={toggleHideFormNodes}
              style={{
                appearance: 'none',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: `2px solid ${grammaticalColorStyles.form}`,
                backgroundColor: !hideFormNodes ? grammaticalColorStyles.form : 'transparent',
                cursor: 'pointer',
              }}
            />
            <span style={{ color: grammaticalColorStyles.form }}>
              {t.formNodes}{!hideFormNodes && availableClassifications.length > 0 ? ':' : ''}
            </span>
          </label>

          {!hideFormNodes && (
            <div className="ml-[26px] mt-[5px] flex gap-[15px] flex-wrap">
              {availableClassifications.map(classification => (
                <label key={classification} className="flex items-center gap-[5px]">
                  <input
                    type="checkbox"
                    checked={selectedFormClassifications.includes(classification)}
                    onChange={() => handleClassificationToggle(classification)}
                    style={{
                      appearance: 'none',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${grammaticalColorStyles.form}`,
                      backgroundColor: selectedFormClassifications.includes(classification) ? grammaticalColorStyles.form : 'transparent',
                      cursor: 'pointer',
                    }}
                  />
                  <span className="text-[14px]" style={{ color: grammaticalColorStyles.form }}>
                    {classificationLabels[classification]}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterController;
