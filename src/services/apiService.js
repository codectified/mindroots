import axios from 'axios';

// // Create an Axios instance with the base URL for the API
const api = axios.create({
  baseURL: 'https://theoption.life/api',
});

// const api = axios.create({
//   baseURL: 'http://localhost:5001/api',
// });


// Helper function to convert Neo4j integers to regular numbers
const convertIntegers = (obj) => {
  if (typeof obj === 'object' && obj !== null) {
    if ('low' in obj && 'high' in obj) {
      return obj.low;
    }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = convertIntegers(obj[key]);
      }
    }
  }
  return obj;
};

export const fetchQuranItems = async (corpusId, surahIndex) => {
  try {
    const response = await api.get('/list/quran_items', {
      params: { corpus_id: corpusId, sura_index: surahIndex },
    });
    return response.data.map(item => convertIntegers(item)); // Ensure integers are handled correctly
  } catch (error) {
    console.error('Error fetching Quran items:', error);
    throw error;
  }
};

// Fetches aya count for a given surah
export const fetchAyaCount = async (surahIndex) => {
  try {
    const response = await api.get('/list/surah_aya_count', {
      params: { sura_index: surahIndex },
    });
    return response.data.aya_count; // Assuming aya_count is returned
  } catch (error) {
    console.error('Error fetching Aya count:', error);
    throw error;
  }
};


// Fetch Poetry Items by corpus_id
export const fetchPoetryItems = async (corpusId) => {
  try {
    const response = await api.get('/list/poetry_items', {
      params: { corpus_id: corpusId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching poetry items:', error);
    throw error;
  }
};

// Fetch Prose Items by corpus_type
export const fetchProseItems = async (corpusType) => {
  try {
    const response = await api.get(`/list/prose_items`, {
      params: { corpus_type: corpusType }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching prose items:', error);
    throw error;
  }
};

// Updated fetch functions to handle Neo4j integers
export const fetchWords = async (concept, script) => {
  const response = await api.get(`/list/${concept}`, { params: { script } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordData = async (word, script) => {
  const response = await api.get(`/word/${word}`, { params: { script } });
  return convertIntegers(response.data);
};

export const fetchWordsByFormWithLexicon = async (formId, L1, L2, limit = 100) => {
  const endpoint = `/form/${formId}/lexicon`;
  const response = await api.get(endpoint, { params: { L1, L2, limit } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordsByFormWithCorpus = async (formId, corpusId, L1, L2, limit = 100) => {
  const endpoint = `/form/${formId}/corpus/${corpusId}`;
  const response = await api.get(endpoint, { params: { L1, L2, limit } });
  return response.data.map(item => convertIntegers(item));
};


export const fetchWordsByRootWithLexicon = async (rootId, L1, L2) => {
  const endpoint = `/root/${rootId}/lexicon`;
  const response = await api.get(endpoint, { params: { L1, L2 } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordsByRootWithCorpus = async (rootId, corpusId, L1, L2) => {
  const endpoint = `/root/${rootId}/corpus/${corpusId}`;
  const response = await api.get(endpoint, { params: { L1, L2 } });
  return response.data.map(item => convertIntegers(item));
};


// Fetch corpus items for a given corpus_id
export const fetchCorpusItems = async (corpusId, script) => {
  const response = await api.get('/list/corpus_items', { params: { corpus_id: corpusId } });

  return response.data.map(item => ({
    ...convertIntegers(item),
    label: script === 'both' ? `${item.arabic} / ${item.english}` : item[script],
  }));
};

// Fetch words, forms, and roots by corpus item ID
export const fetchWordsByCorpusItem = async (itemId, corpusId, L1, L2) => {
  const response = await api.get(`/words_by_corpus_item/${itemId}`, { params: { corpusId, L1 } });
  const data = convertIntegers(response.data);

  return {
    ...data,
    words: data.words ? data.words.map(word => ({
      ...word,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`,
    })) : [],
    forms: data.forms ? data.forms.map(form => ({
      ...form,
      label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
    })) : [],
    roots: data.roots ? data.roots.map(root => ({
      ...root,
      label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
    })) : [],
  };
};



// Execute a Cypher query by sending it to the backend
export const executeQuery = async (query) => {
  try {
    const response = await api.post('/execute-query', { query });  // Axios uses the baseURL set earlier
    return response.data;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

export const fetchRootByWord = async (wordId, L1, L2) => {
  try {
    const response = await api.get(`/rootbyword/${wordId}`, {
      params: { L1, L2 }
    });
    return convertIntegers(response.data); // Convert integers before returning the data
  } catch (error) {
    console.error('Error fetching root by word:', error);
    throw error;
  }
};

export const fetchFormsByWord = async (wordId, L1, L2) => {
  try {
    const response = await api.get(`/formsbyword/${wordId}`, {
      params: { L1, L2 }
    });
    return response.data.map(item => convertIntegers(item)); // Convert integers before returning the data
  } catch (error) {
    console.error('Error fetching forms by word:', error);
    throw error;
  }
};






// Fetch all available corpora
export const fetchCorpora = async () => {
  const response = await api.get('/list/corpora');
  return response.data.map(item => convertIntegers(item));
};

export const fetchLaneEntry = async (wordId) => {
  try {
    const response = await api.get(`/laneentry/${wordId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Lane entry by word:', error);
    throw error;
  }
};

export const fetchHansWehrEntry = async (wordId) => {
  try {
    const response = await api.get(`/hanswehrentry/${wordId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Hans Wehr entry by word:', error);
    throw error;
  }
};

export const fetchRootByLetters = async (r1, r2, r3, L1, L2) => {
  try {
    const response = await api.get('/rootbyletters', {
      params: {
        r1,
        r2,
        r3,
        L1,
        L2
      }
    });

    // Convert Neo4j number types to JavaScript integers before returning
    return convertIntegers(response.data);
  } catch (error) {
    console.error('Error fetching roots by letters:', error);
    throw error;
  }
};

export const fetchMarkdownFiles = async () => {
  try {
    const response = await api.get('/list-markdown-files');
    return response.data;
  } catch (error) {
    console.error('Error fetching markdown files:', error);
    throw error;
  }
};