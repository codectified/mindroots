import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchCorpora } from '../../services/apiService';
import MiniMenu from './MiniMenu';
import { useCorpus } from '../../contexts/CorpusContext';
import { useLanguage } from '../../contexts/LanguageContext';

const ArticlesAndReferences = () => {
  const navigate = useNavigate();
  const { handleSelectCorpus } = useCorpus(); // Use context to store the selected corpus
  const { L1, L2 } = useLanguage(); // Get L1 and L2 from context
  const [corpora, setCorpora] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState(['arabic', 'english']); // Default languages

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const data = await fetchCorpora();
        setCorpora(data);

        if (data.length > 0) {
          const sampleCorpus = data[0];
          const languages = ['arabic', 'english'];
          if (sampleCorpus.transliteration) languages.push('transliteration');
          if (sampleCorpus.sem) languages.push('sem');
          setAvailableLanguages(languages);
        }
      } catch (error) {
        console.error('Error fetching corpora:', error);
      }
    };
    fetchCorporaData();
  }, []);

  const handleSelect = (corpus) => {
    console.log('Selected corpus in ArticlesAndReferences:', corpus);
    handleSelectCorpus(corpus);
    navigate(`/list?corpus_id=${corpus.id}&corpus_name=${encodeURIComponent(corpus[L1] || corpus.english || corpus.arabic)}`);
  };

  // Separate corpora by type
  const corpus99Names = corpora.find(c => c.id === 1); // 99 Names
  const corpusQuran = corpora.find(c => c.id === 2);   // Quran
  const poetryCorpora = corpora.filter(c => c.corpusType === 'poetry'); // Poetry

  return (
    <div className="corpus-library-container">
      <MiniMenu />
      
      <div className="corpus-library-header">
        <h1 className="library-title">Corpus Library</h1>
      </div>

      {/* Top Row: Quran (left) and 99 Names (right) */}
      <div className="corpus-top-row">
        {corpusQuran && (
          <div className="corpus-card corpus-left" onClick={() => handleSelect(corpusQuran)}>
            <h2 className="corpus-title">
              {L2 === 'off' ? corpusQuran[L1] : corpusQuran[L1]}
            </h2>
            {L2 !== 'off' && (
              <p className="corpus-subtitle">{corpusQuran[L2]}</p>
            )}
          </div>
        )}
        
        {corpus99Names && (
          <div className="corpus-card corpus-right" onClick={() => handleSelect(corpus99Names)}>
            <h2 className="corpus-title">
              {L2 === 'off' ? corpus99Names[L1] : corpus99Names[L1]}
            </h2>
            {L2 !== 'off' && (
              <p className="corpus-subtitle">{corpus99Names[L2]}</p>
            )}
          </div>
        )}
      </div>

      {/* Poetry Section */}
      {poetryCorpora.length > 0 && (
        <div className="poetry-section">
          <h2 className="section-title">Poetry</h2>
          <div className="poetry-corpora">
            {poetryCorpora.map((corpus) => (
              <div key={corpus.id} className="corpus-card poetry-card" onClick={() => handleSelect(corpus)}>
                <h3 className="corpus-title">
                  {L2 === 'off' ? corpus[L1] : corpus[L1]}
                </h3>
                {L2 !== 'off' && (
                  <p className="corpus-subtitle">{corpus[L2]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticlesAndReferences;