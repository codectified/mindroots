// ../components/selectors/FilterController.js
import React from 'react';
import { useFilter } from '../../contexts/FilterContext';
import { useWordShade } from '../../contexts/WordShadeContext';

const FilterController = () => {
  const { filterWordTypes, toggleWordType, hideFormNodes, toggleHideFormNodes } = useFilter();
  const { wordShadeMode } = useWordShade();

  const grammaticalColorStyles = {
    phrase: '#FFCCCC',
    verb: '#FF6666',
    noun: '#CC0000',
    unclassified: '#660000',
    form: '#007bff',
  };

  const ontologicalColorStyles = {
    phrase: '#000000', // Black for all word nodes in ontological mode
    verb: '#000000',
    noun: '#000000',
    unclassified: '#000000',
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
      <label>Filter by Nodes:</label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {['phrase', 'verb', 'noun', 'unclassified'].map((type) => (
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
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </label>
        ))}

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
          <span style={{ color: grammaticalColorStyles.form }}>Form Nodes</span>
        </label>
      </div>
    </div>
  );
};

export default FilterController;