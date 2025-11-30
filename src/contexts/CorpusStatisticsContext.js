import React, { createContext, useState, useEffect } from 'react';

const CorpusStatisticsContext = createContext();

export const CorpusStatisticsProvider = ({ children }) => {
  const [showStatistics, setShowStatistics] = useState(false);

  // Persist preference to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('showCorpusStatistics');
    if (saved !== null) {
      setShowStatistics(JSON.parse(saved));
    }
  }, []);

  const handleToggleStatistics = () => {
    const newValue = !showStatistics;
    setShowStatistics(newValue);
    localStorage.setItem('showCorpusStatistics', JSON.stringify(newValue));
  };

  return (
    <CorpusStatisticsContext.Provider value={{ showStatistics, handleToggleStatistics }}>
      {children}
    </CorpusStatisticsContext.Provider>
  );
};

export const useCorpusStatistics = () => {
  const context = React.useContext(CorpusStatisticsContext);
  if (!context) {
    throw new Error('useCorpusStatistics must be used inside CorpusStatisticsProvider');
  }
  return context;
};
