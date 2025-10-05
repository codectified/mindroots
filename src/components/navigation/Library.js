import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchCorpora } from '../../services/apiService';
import { useCorpus } from '../../contexts/CorpusContext';
import { useLanguage } from '../../contexts/LanguageContext';

const ArticlesAndReferences = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSelectCorpus } = useCorpus(); // Use context to store the selected corpus
  const { L1, L2 } = useLanguage(); // Get L1 and L2 from context
  const [corpora, setCorpora] = useState([]);

  useEffect(() => {
    const fetchCorporaData = async () => {
      try {
        const data = await fetchCorpora();
        setCorpora(data);

      } catch (error) {
        console.error('Error fetching corpora:', error);
      }
    };
    fetchCorporaData();
  }, []);

  const handleSelect = (corpus) => {
    console.log('Selected corpus in ArticlesAndReferences:', corpus);
    handleSelectCorpus(corpus);
    
    let navigationUrl = `/list?corpus_id=${corpus.id}&corpus_name=${encodeURIComponent(corpus[L1] || corpus.english || corpus.arabic)}`;
    
    // For Quran (Corpus 2), restore last saved position if available
    if (corpus.id === 2) {
      const savedQuranPosition = sessionStorage.getItem('lastQuranPosition');
      if (savedQuranPosition) {
        try {
          const position = JSON.parse(savedQuranPosition);
          console.log('📖 Restoring saved Quran position:', position);
          navigationUrl += `&corpus_type=quran&surah=${position.surah}&aya=${position.aya}`;
        } catch (error) {
          console.error('Error parsing saved Quran position:', error);
          navigationUrl += '&corpus_type=quran';
        }
      } else {
        navigationUrl += '&corpus_type=quran';
      }
    }
    
    navigate(navigationUrl);
  };

  // Handle "View in Context" navigation
  useEffect(() => {
    const selectedCorpusItemData = sessionStorage.getItem('selectedCorpusItem');
    if (selectedCorpusItemData) {
      try {
        const corpusItemData = JSON.parse(selectedCorpusItemData);
        console.log('📚 Library: Processing "View in Context" navigation');
        
        // Build navigation URL based on corpus item
        const corpusId = corpusItemData.corpus_id?.low || corpusItemData.corpus_id;
        const corpusInfo = {
          1: { name: '99 Names', type: 'text' },
          2: { name: 'Quran', type: 'quran' },
          3: { name: 'Poetry', type: 'poetry' }
        };
        
        const targetCorpus = corpusInfo[corpusId];
        if (targetCorpus) {
          const queryParams = new URLSearchParams({
            corpus_id: corpusId.toString(),
            corpus_name: targetCorpus.name,
            corpus_type: targetCorpus.type
          });
          
          // For Corpus 2 (Quran) with hierarchical IDs, add position parameters
          if (corpusId === 2 && typeof corpusItemData.item_id === 'string' && corpusItemData.item_id.includes(':')) {
            const [surah, aya] = corpusItemData.item_id.split(':');
            queryParams.set('surah', surah);
            queryParams.set('aya', aya);
          }
          
          navigate(`/list?${queryParams.toString()}`);
          return;
        }
      } catch (error) {
        console.error('Error processing selectedCorpusItem:', error);
      }
      sessionStorage.removeItem('selectedCorpusItem');
    }
  }, [navigate]);

  // Separate corpora by type
  const corpus99Names = corpora.find(c => c.id === 1); // 99 Names
  const corpusQuran = corpora.find(c => c.id === 2);   // Quran
  const poetryCorpora = corpora.filter(c => c.corpusType === 'poetry'); // Poetry

  return (
    <div className="corpus-library-container">
      
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