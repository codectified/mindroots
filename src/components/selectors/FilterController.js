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

  // Hardcoded available classifications - always show these three options and always clickable
  // All normalized to proper case for display
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

  const grammaticalColorStyles = {
    phrase: '#FFCCCC',
    verb: '#FF6666',
    noun: '#CC0000',
    form: '#007bff',
  };

  const ontologicalColorStyles = {
    phrase: '#000000', // Black for all word nodes in ontological mode
    verb: '#000000',
    noun: '#000000',
    form: '#007bff', // Form nodes always blue
  };

  const getColorStyles = (type) => {
    const colorStyles =
      wordShadeMode === 'grammatical' ? grammaticalColorStyles : ontologicalColorStyles;

    return {
      border: `2px solid ${colorStyles[type]}`,
      backgroundColor: filterWordTypes.includes(type) ? colorStyles[type] : 'transparent',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {['phrase', 'verb', 'noun'].map((type) => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <span
              style={{
                color:
                  wordShadeMode === 'grammatical'
                    ? grammaticalColorStyles[type]
                    : ontologicalColorStyles[type],
              }}
            >
              {typeLabels[type]}
            </span>
          </label>
        ))}

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <div style={{ marginLeft: '26px', marginTop: '5px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {availableClassifications.map(classification => {
                return (
                  <label key={classification} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px'
                  }}>
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
                    <span style={{
                      color: grammaticalColorStyles.form,
                      fontSize: '14px'
                    }}>
                      {classificationLabels[classification]}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterController;