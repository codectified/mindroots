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

  // Hardcoded available classifications - always show these three options
  // Note: 'ontological' is lowercase in database, 'Grammatical' is capitalized
  const availableClassifications = ['ontological', 'Grammatical', 'Morphological'];
  
  // Check which classifications are actually present in the current graph data
  const presentClassifications = React.useMemo(() => {
    const formNodes = graphData.nodes.filter(node => node.type === 'form');
    const currentClassifications = formNodes
      .map(node => node.classification)
      .filter(classification => classification && classification.trim() !== '');
    
    return new Set(currentClassifications);
  }, [graphData.nodes]);

  // Initialize selections when classifications become available
  React.useEffect(() => {
    // Only update if we have present classifications and current selection doesn't match
    if (presentClassifications.size > 0) {
      const presentClassificationsList = [...presentClassifications];
      const currentlySelected = selectedFormClassifications.filter(c => presentClassifications.has(c));
      
      // If current selection doesn't include all present classifications, update it
      if (presentClassificationsList.some(c => !selectedFormClassifications.includes(c))) {
        setSelectedFormClassifications(presentClassificationsList);
      }
    }
  }, [presentClassifications, selectedFormClassifications, setSelectedFormClassifications]);

  const handleClassificationToggle = (classification) => {
    // Only allow toggling if the classification is present in the graph
    if (!presentClassifications.has(classification)) {
      return;
    }
    
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
          
          {!hideFormNodes && (
            <div style={{ marginLeft: '26px', marginTop: '5px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {availableClassifications.map(classification => {
                const isPresent = presentClassifications.has(classification);
                const isDisabled = !isPresent;
                
                return (
                  <label key={classification} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    opacity: isDisabled ? 0.5 : 1
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedFormClassifications.includes(classification)}
                      onChange={() => !isDisabled && handleClassificationToggle(classification)}
                      disabled={isDisabled}
                      style={{
                        appearance: 'none',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `2px solid ${isDisabled ? '#ccc' : grammaticalColorStyles.form}`,
                        backgroundColor: selectedFormClassifications.includes(classification) && !isDisabled ? grammaticalColorStyles.form : 'transparent',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    />
                    <span style={{ 
                      color: isDisabled ? '#ccc' : grammaticalColorStyles.form, 
                      fontSize: '14px' 
                    }}>
                      {classification}
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