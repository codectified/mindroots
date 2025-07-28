// ../components/selectors/FilterController.js
import React from 'react';
import { useFilter } from '../../contexts/FilterContext';
import { useWordShade } from '../../contexts/WordShadeContext';
import { useFormFilter } from '../../contexts/FormFilterContext';
import { useGraphData } from '../../contexts/GraphDataContext';

const FilterController = () => {
  const { filterWordTypes, toggleWordType, hideFormNodes, toggleHideFormNodes } = useFilter();
  const { wordShadeMode } = useWordShade();
  const { selectedFormClassifications, setSelectedFormClassifications } = useFormFilter();
  const { graphData } = useGraphData();
  const allSeenClassifications = React.useRef(new Set());

  // Get available form classifications - track all ever seen
  const availableClassifications = React.useMemo(() => {
    const formNodes = graphData.nodes.filter(node => node.type === 'form');
    const currentClassifications = formNodes
      .map(node => node.classification)
      .filter(classification => classification && classification.trim() !== '');
    
    // Add to our running set of all seen classifications
    currentClassifications.forEach(classification => {
      allSeenClassifications.current.add(classification);
    });
    
    // Return all seen classifications, not just current ones
    return [...allSeenClassifications.current].sort();
  }, [graphData.nodes]);

  // Initialize selections when classifications become available
  React.useEffect(() => {
    if (selectedFormClassifications.length === 0 && availableClassifications.length > 0) {
      setSelectedFormClassifications(availableClassifications);
    }
  }, [availableClassifications, selectedFormClassifications.length, setSelectedFormClassifications]);

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
              Form Nodes{!hideFormNodes && availableClassifications.length > 0 ? ':' : ''}
            </span>
          </label>
          
          {!hideFormNodes && availableClassifications.length > 0 && (
            <div style={{ marginLeft: '26px', marginTop: '5px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {availableClassifications.map(classification => (
                <label key={classification} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                  <span style={{ color: grammaticalColorStyles.form, fontSize: '14px' }}>
                    {classification}
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