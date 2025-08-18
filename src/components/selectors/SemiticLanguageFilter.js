import React, { useState } from 'react';
import { useSemiticLanguageFilter } from '../../contexts/SemiticLanguageFilterContext';

const SemiticLanguageFilter = () => {
  const { 
    selectedSemiticLanguages, 
    setSelectedSemiticLanguages, 
    semiticLanguageGroups,
    getAllLanguages 
  } = useSemiticLanguageFilter();
  
  const [expandedGroups, setExpandedGroups] = useState({});

  const handleLanguageToggle = (language) => {
    if (selectedSemiticLanguages.includes(language)) {
      setSelectedSemiticLanguages(prev => prev.filter(l => l !== language));
    } else {
      setSelectedSemiticLanguages(prev => [...prev, language]);
    }
  };

  const handleGroupToggle = (groupName) => {
    const groupLanguages = semiticLanguageGroups[groupName];
    const allSelected = groupLanguages.every(lang => selectedSemiticLanguages.includes(lang));
    
    if (allSelected) {
      // Deselect all languages in this group
      setSelectedSemiticLanguages(prev => prev.filter(lang => !groupLanguages.includes(lang)));
    } else {
      // Select all languages in this group
      setSelectedSemiticLanguages(prev => {
        const newSelection = [...prev];
        groupLanguages.forEach(lang => {
          if (!newSelection.includes(lang)) {
            newSelection.push(lang);
          }
        });
        return newSelection;
      });
    }
  };

  const toggleGroupExpansion = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleSelectAll = () => {
    setSelectedSemiticLanguages(getAllLanguages());
  };

  const handleSelectNone = () => {
    setSelectedSemiticLanguages([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label>Semitic Languages:</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSelectAll}
            style={{ fontSize: '12px', padding: '2px 6px' }}
            className="button"
          >
            All
          </button>
          <button 
            onClick={handleSelectNone}
            style={{ fontSize: '12px', padding: '2px 6px' }}
            className="button"
          >
            None
          </button>
        </div>
      </div>
      
      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
        {Object.entries(semiticLanguageGroups).map(([groupName, languages]) => {
          const allGroupSelected = languages.every(lang => selectedSemiticLanguages.includes(lang));
          const someGroupSelected = languages.some(lang => selectedSemiticLanguages.includes(lang));
          
          return (
            <div key={groupName} style={{ marginBottom: '10px' }}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={allGroupSelected}
                  ref={input => {
                    if (input) input.indeterminate = someGroupSelected && !allGroupSelected;
                  }}
                  onChange={() => handleGroupToggle(groupName)}
                  style={{ accentColor: '#007bff' }}
                />
                <strong 
                  onClick={() => toggleGroupExpansion(groupName)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {expandedGroups[groupName] ? '▼' : '▶'} {groupName} ({languages.length})
                </strong>
              </div>
              
              {/* Group languages (collapsible) */}
              {expandedGroups[groupName] && (
                <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {languages.map(language => (
                    <label key={language} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={selectedSemiticLanguages.includes(language)}
                        onChange={() => handleLanguageToggle(language)}
                        style={{ accentColor: '#007bff' }}
                      />
                      {language}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        {selectedSemiticLanguages.length} of {getAllLanguages().length} languages selected
      </div>
    </div>
  );
};

export default SemiticLanguageFilter;