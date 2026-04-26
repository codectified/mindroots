import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchQuranItemsRange, fetchAyaCount, fetchCorpusItems, fetchPoetryItems } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCorpus } from '../../contexts/CorpusContext';
import CorpusRenderer from '../utils/CorpusRenderer'; // Import the consolidated rendering component
import TextLayoutToggle from '../selectors/TextLayoutSelector';
import HighlightController from '../selectors/HighlightController';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { useCorpusStatistics } from '../../contexts/CorpusStatisticsContext';
import { useLabels } from '../../hooks/useLabels';

const PrimaryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surah, setSurah] = useState(1); // Default to Surah 1 for Quran
  const [aya, setAya] = useState(0); // Default to Aya 0 (all Ayas)
  const [ayaCount, setAyaCount] = useState(7); // Default Aya count for Surah 1
  const [ayahsPerPage, setAyahsPerPage] = useState(10); // Track ayahs per page
  const [showTextSettings, setShowTextSettings] = useState(false); // Text settings collapsed by default
  const [fontSize, setFontSize] = useState(16); // Font size control
  const { L1, L2 } = useLanguage();
  const { handleSelectCorpusItem } = useCorpus();
  const { showStatistics, handleToggleStatistics } = useCorpusStatistics();
  const t = useLabels();

  const queryParams = new URLSearchParams(location.search);
  const corpusId = queryParams.get('corpus_id');
  const corpusName = queryParams.get('corpus_name');
  const corpusType = queryParams.get('corpus_type'); // Use corpus_type for poetry and prose
  
  // Handle "View in Context" navigation parameters
  const urlSurah = queryParams.get('surah');
  const urlAya = queryParams.get('aya');


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log('Fetching data for corpus ID:', corpusId);
  
      if (corpusId === '2') { // Quran
        try {
          console.log('Fetching Quran items...');
          let quranData;
          
          if (aya === 0) {
            // Fetch first page of ayat - using ayahsPerPage setting
            const endAya = Math.min(ayahsPerPage, ayaCount || ayahsPerPage);
            quranData = await fetchQuranItemsRange(corpusId, surah, 1, endAya);
          } else if (aya < 0) {
            // Special case: coming from next surah, start from the end
            const startAya = Math.max(1, (ayaCount || 286) - ayahsPerPage + 1);
            const endAya = ayaCount || 286;
            quranData = await fetchQuranItemsRange(corpusId, surah, startAya, endAya);
          } else {
            // Fetch range starting from specified aya
            const startAya = Math.max(1, aya);
            const endAya = Math.min(ayaCount || (startAya + ayahsPerPage - 1), startAya + ayahsPerPage - 1);
            quranData = await fetchQuranItemsRange(corpusId, surah, startAya, endAya);
          }
          
          setItems(quranData);
        } catch (error) {
          console.error('Error fetching Quran items:', error);
        }
      } else if (corpusId === '1') { // 99 Names
        try {
          console.log('Fetching corpus items for 99 Names...');
          const listData = await fetchCorpusItems(corpusId, L1, L2);
          setItems(listData);
        } catch (error) {
          console.error('Error fetching corpus items:', error);
        }
      } else if (corpusId === '3') { // Poetry
        try {
          console.log('Fetching poetry items for corpus ID 3...');
          const poetryData = await fetchPoetryItems(corpusId); // Use the poetry fetch function
          setItems(poetryData);
        } catch (error) {
          console.error('Error fetching poetry items:', error);
        }
      } else {
        console.error('Unrecognized corpus ID:', corpusId);
      }
      setLoading(false);
    };
  
    fetchData();
  }, [corpusId, surah, aya, ayahsPerPage, L1, L2, ayaCount]);

  useEffect(() => {
    if (corpusId === '2') { // Fetch Aya count when Surah changes (for Quran)
      const fetchAyaData = async () => {
        try {
          const ayaCountData = await fetchAyaCount(surah);
          setAyaCount(ayaCountData);
          setAya(0); // Reset to show all Ayas when Surah changes
        } catch (error) {
          console.error('Error fetching Aya count:', error);
        }
      };
      fetchAyaData();
    }
  }, [surah, corpusId]);

  // Handle "View in Context" navigation from graph screen
  useEffect(() => {
    const selectedCorpusItemData = sessionStorage.getItem('selectedCorpusItem');
    if (selectedCorpusItemData) {
      try {
        const corpusItemData = JSON.parse(selectedCorpusItemData);
        console.log('🎯 View in Context: Setting selected corpus item from sessionStorage:', corpusItemData);
        handleSelectCorpusItem(corpusItemData);
        
        // For Corpus 2 (Quran), extract position from hierarchical ID
        const itemCorpusId = corpusItemData.corpus_id?.low || corpusItemData.corpus_id;
        if (itemCorpusId === 2 && typeof corpusItemData.item_id === 'string' && corpusItemData.item_id.includes(':')) {
          const [surahFromId, ayaFromId] = corpusItemData.item_id.split(':');
          console.log(`🎯 View in Context: Setting position from corpus item ID: Surah ${surahFromId}, Aya ${ayaFromId}`);
          setSurah(parseInt(surahFromId));
          setAya(parseInt(ayaFromId));
          
          // Force update the saved state with the correct position immediately
          const updatedState = {
            corpusId: itemCorpusId.toString(),
            corpusName: corpusItemData.corpus_name || (itemCorpusId === 2 ? 'Quran' : 'Unknown'),
            corpusType: itemCorpusId === 2 ? 'quran' : 'text',
            surah: parseInt(surahFromId),
            aya: parseInt(ayaFromId),
            ayaCount: ayaCount || 7,
            ayahsPerPage: ayahsPerPage || 10,
            timestamp: Date.now()
          };
          sessionStorage.setItem('lastCorpusState', JSON.stringify(updatedState));
          console.log('🎯 View in Context: Updated corpus state with correct position:', updatedState);
        }
        
        // Clear the selectedCorpusItem data after using it
        sessionStorage.removeItem('selectedCorpusItem');
      } catch (error) {
        console.error('Error parsing selected corpus item from sessionStorage:', error);
        sessionStorage.removeItem('selectedCorpusItem'); // Clear invalid data
      }
    }
  }, []); // Run only once when component mounts

  // Handle URL parameters for surah/aya positioning (from "View in Context")
  useEffect(() => {
    console.log(`PrimaryList URL parameters: corpusId=${corpusId}, urlSurah=${urlSurah}, urlAya=${urlAya}`);
    if (corpusId === '2' && urlSurah && urlAya) {
      console.log(`Setting position from URL: Surah ${urlSurah}, Aya ${urlAya}`);
      setSurah(parseInt(urlSurah));
      setAya(parseInt(urlAya));
    }
  }, [corpusId, urlSurah, urlAya]);

  const handleItemClick = (item) => {
    // Ensure the item has corpus_id attached for proper graph expansion
    const itemWithCorpusId = {
      ...item,
      corpus_id: parseInt(corpusId) // Add the current corpus ID to the item
    };
    console.log('🎯 PrimaryList handleItemClick: Adding corpus_id to item:', itemWithCorpusId);
    handleSelectCorpusItem(itemWithCorpusId);
    navigate('/graph');
  };

  // Save Quran position specifically for Corpus 2
  useEffect(() => {
    if (corpusId === '2') { // Only save for Quran
      const quranPosition = {
        surah,
        aya,
        ayaCount,
        ayahsPerPage,
        timestamp: Date.now()
      };
      sessionStorage.setItem('lastQuranPosition', JSON.stringify(quranPosition));
      console.log('💾 Saved Quran position:', quranPosition);
    }
  }, [corpusId, surah, aya, ayaCount, ayahsPerPage]);

  return (
    <div>
      {/* Consolidated Header with Text Settings */}
      <div className="page-header mb-5 px-5 py-[15px] border border-[#a8d5a8] rounded-xl bg-[#f8fdf8] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
        <div className={`flex items-center justify-between ${showTextSettings ? 'mb-[15px]' : ''}`}>
          <h1 className="m-0 text-[24px] text-[#2d5a2d] font-semibold">
            {corpusName}
          </h1>
          <button
            onClick={() => setShowTextSettings(!showTextSettings)}
            className={`bg-transparent border-none cursor-pointer py-2 px-3 rounded-md transition-colors duration-200 hover:bg-[#e8f5e8] ${showTextSettings ? 'bg-[#e8f5e8]' : ''}`}
          >
            <FontAwesomeIcon icon={faEllipsisV} className="text-[#4a7c4a] text-[18px]" />
          </button>
        </div>
        {showTextSettings && (
          <div className="pt-[15px] border-t border-[#d4edd4] grid grid-cols-2 gap-[15px] items-center">
            <div className="col-start-1 col-end-2">
              <TextLayoutToggle />
            </div>
            <div className="col-start-2 col-end-3">
              <HighlightController />
            </div>

            <div className="flex items-center gap-2 col-start-1 col-end-2">
              <label className="text-[14px] text-[#4a7c4a] font-medium whitespace-nowrap">
                {t.fontSizeLabel}
              </label>
              <input
                type="range"
                min="12"
                max="32"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-[60px]"
                style={{ accentColor: '#4a7c4a' }}
              />
              <span className="text-[12px] text-muted min-w-[30px]">
                {fontSize}px
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer col-start-2 col-end-3">
              <input
                type="checkbox"
                checked={showStatistics}
                onChange={handleToggleStatistics}
                className="cursor-pointer w-4 h-4 flex-shrink-0"
                style={{ accentColor: '#4a7c4a' }}
              />
              <span className="text-[14px] text-[#4a7c4a] font-medium">
                {t.showStatistics}
              </span>
            </label>

            <button
              onClick={() => navigate('/corpus-menu')}
              className="py-2 px-4 bg-[#4a7c4a] text-white border-none rounded-md cursor-pointer text-[14px] font-medium transition-colors hover:bg-[#3a6a3a] col-span-full justify-self-start"
            >
              {t.returnToLibrary}
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center p-5 text-[16px] text-muted">
          {t.loading}
        </div>
      )}

      {!loading && (
        /* Use CorpusRenderer to handle rendering based on corpus type */
        <CorpusRenderer
        corpusId={corpusId}
        corpusType={corpusType}
        items={items}
        setItems={setItems} // Pass setItems as a prop
        surah={surah}
        aya={aya}
        setSurah={setSurah}
        setAya={setAya}
        ayaCount={ayaCount}
        ayahsPerPage={ayahsPerPage}
        setAyahsPerPage={setAyahsPerPage}
        fontSize={fontSize}
        L1={L1}
        L2={L2}
        handleSelectCorpusItem={handleItemClick}
      />
      )}
    </div>
  );
};

export default PrimaryList;