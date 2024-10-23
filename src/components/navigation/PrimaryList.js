import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchQuranItems, fetchAyaCount, fetchCorpusItems, fetchPoetryItems, fetchProseItems } from '../../services/apiService';
import MiniMenu from './MiniMenu';
import { useScript } from '../../contexts/ScriptContext';
import { useCorpus } from '../../contexts/CorpusContext';
import CorpusRenderer from '../utils/CorpusRenderer'; // Import the consolidated rendering component

const PrimaryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [surah, setSurah] = useState(1); // Default to Surah 1 for Quran
  const [aya, setAya] = useState(0); // Default to Aya 0 (all Ayas)
  const [ayaCount, setAyaCount] = useState(7); // Default Aya count for Surah 1
  const { L1, L2 } = useScript();
  const { handleSelectCorpusItem } = useCorpus();

  const queryParams = new URLSearchParams(location.search);
  const corpusId = queryParams.get('corpus_id');
  const corpusName = queryParams.get('corpus_name');
  const corpusType = queryParams.get('corpus_type'); // Use corpus_type for poetry and prose

  // Fetch the correct data based on corpus type
  useEffect(() => {
    const fetchData = async () => {
      if (corpusId === '2') { // Quran
        try {
          const quranData = await fetchQuranItems(corpusId, surah);
          const filteredData = aya === 0 ? quranData : quranData.filter(item => item.aya_index === aya);
          setItems(filteredData);
        } catch (error) {
          console.error('Error fetching Quran items:', error);
        }
      } else if (corpusId === '1') { // 99 Names (Simple List)
        try {
          const listData = await fetchCorpusItems(corpusId, L1);
          setItems(listData);
        } catch (error) {
          console.error('Error fetching corpus items:', error);
        }
      } else if (corpusType === 'poetry') { // Poetry (by Poem and Line)
        try {
          const poetryData = await fetchPoetryItems(corpusType);
          setItems(poetryData);
        } catch (error) {
          console.error('Error fetching poetry items:', error);
        }
      } else if (corpusType === 'prose') { // Prose (without Ayah markers)
        try {
          const proseData = await fetchProseItems(corpusType);
          setItems(proseData);
        } catch (error) {
          console.error('Error fetching prose items:', error);
        }
      }
    };

    fetchData();
  }, [corpusId, surah, aya, L1, corpusType]);

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

  const handleItemClick = (item) => {
    handleSelectCorpusItem(item);
    navigate('/graph');
  };

  return (
    <div>
      <MiniMenu />
      <h1>{corpusName}</h1>

      {/* Use CorpusRenderer to handle rendering based on corpus type */}
      <CorpusRenderer
        corpusId={corpusId}
        corpusType={corpusType}
        items={items}
        surah={surah}
        aya={aya}
        setSurah={setSurah}
        setAya={setAya}
        ayaCount={ayaCount}
        L1={L1}
        L2={L2}
        handleSelectCorpusItem={handleItemClick} // Pass the click handler function here
      />
    </div>
  );
};

export default PrimaryList;