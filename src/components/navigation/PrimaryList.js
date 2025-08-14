import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchQuranItems, fetchQuranItemsRange, fetchAyaCount, fetchCorpusItems, fetchPoetryItems, fetchProseItems } from '../../services/apiService';
import MiniMenu from './MiniMenu';
import { useScript } from '../../contexts/ScriptContext';
import { useCorpus } from '../../contexts/CorpusContext';
import CorpusRenderer from '../utils/CorpusRenderer'; // Import the consolidated rendering component

const PrimaryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surah, setSurah] = useState(1); // Default to Surah 1 for Quran
  const [aya, setAya] = useState(0); // Default to Aya 0 (all Ayas)
  const [ayaCount, setAyaCount] = useState(7); // Default Aya count for Surah 1
  const { L1, L2 } = useScript();
  const { handleSelectCorpusItem } = useCorpus();

  const queryParams = new URLSearchParams(location.search);
  const corpusId = queryParams.get('corpus_id');
  const corpusName = queryParams.get('corpus_name');
  const corpusType = queryParams.get('corpus_type'); // Use corpus_type for poetry and prose


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log('Fetching data for corpus ID:', corpusId);
  
      if (corpusId === '2') { // Quran
        try {
          console.log('Fetching Quran items...');
          let quranData;
          
          if (aya === 0) {
            // Fetch limited range for performance - default to first 10 ayat
            const endAya = Math.min(10, ayaCount || 10);
            quranData = await fetchQuranItemsRange(corpusId, surah, 1, endAya);
          } else {
            // Fetch specific aya or small range around it
            const startAya = Math.max(1, aya - 2);
            const endAya = Math.min(ayaCount || aya + 2, aya + 2);
            quranData = await fetchQuranItemsRange(corpusId, surah, startAya, endAya);
          }
          
          setItems(quranData);
        } catch (error) {
          console.error('Error fetching Quran items:', error);
        }
      } else if (corpusId === '1') { // 99 Names
        try {
          console.log('Fetching corpus items for 99 Names...');
          const listData = await fetchCorpusItems(corpusId, L1);
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
  }, [corpusId, surah, aya, L1]);

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

      {loading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '20px',
          fontSize: '16px',
          color: '#666'
        }}>
          Loading... Please wait.
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
        L1={L1}
        L2={L2}
        handleSelectCorpusItem={handleItemClick}
      />
      )}
    </div>
  );
};

export default PrimaryList;