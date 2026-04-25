import React, { useState } from 'react';
import { useSemiticLanguageFilter } from '../../contexts/SemiticLanguageFilterContext';
import { useLabels } from '../../hooks/useLabels';

const SemiticLanguageFilter = () => {
  const {
    selectedSemiticLanguages,
    setSelectedSemiticLanguages,
    semiticLanguageGroups,
    getAllLanguages
  } = useSemiticLanguageFilter();
  const t = useLabels();

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
      setSelectedSemiticLanguages(prev => prev.filter(lang => !groupLanguages.includes(lang)));
    } else {
      setSelectedSemiticLanguages(prev => {
        const newSelection = [...prev];
        groupLanguages.forEach(lang => { if (!newSelection.includes(lang)) newSelection.push(lang); });
        return newSelection;
      });
    }
  };

  const toggleGroupExpansion = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleSelectAll = () => setSelectedSemiticLanguages(getAllLanguages());
  const handleSelectNone = () => setSelectedSemiticLanguages([]);

  return (
    <div className="flex flex-col gap-[10px] py-[10px]">
      <div className="flex justify-between items-center">
        <label>{t.semiticLanguages}</label>
        <div className="flex gap-[10px]">
          <button onClick={handleSelectAll} className="button text-[12px] py-[2px] px-[6px]">
            {t.surahAll}
          </button>
          <button onClick={handleSelectNone} className="button text-[12px] py-[2px] px-[6px]">
            {t.surahNone}
          </button>
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto border border-[#ddd] p-[10px] rounded">
        {Object.entries(semiticLanguageGroups).map(([groupName, languages]) => {
          const allGroupSelected = languages.every(lang => selectedSemiticLanguages.includes(lang));
          const someGroupSelected = languages.some(lang => selectedSemiticLanguages.includes(lang));

          return (
            <div key={groupName} className="mb-[10px]">
              <div className="flex items-center gap-[5px] mb-[5px]">
                <input
                  type="checkbox"
                  checked={allGroupSelected}
                  ref={input => { if (input) input.indeterminate = someGroupSelected && !allGroupSelected; }}
                  onChange={() => handleGroupToggle(groupName)}
                  style={{ accentColor: '#007bff' }}
                />
                <strong
                  onClick={() => toggleGroupExpansion(groupName)}
                  className="cursor-pointer select-none"
                >
                  {expandedGroups[groupName] ? '▼' : '▶'} {groupName} ({languages.length})
                </strong>
              </div>

              {expandedGroups[groupName] && (
                <div className="ml-5 flex flex-col gap-[3px]">
                  {languages.map(language => (
                    <label key={language} className="flex items-center gap-[5px] text-[14px]">
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

      <div className="text-[12px] text-muted">
        {selectedSemiticLanguages.length} of {getAllLanguages().length} languages selected
      </div>
    </div>
  );
};

export default SemiticLanguageFilter;
