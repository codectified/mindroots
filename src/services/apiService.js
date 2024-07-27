import axios from 'axios';

// Create an Axios instance with the base URL for the API
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

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

// Updated fetch functions to handle Neo4j integers
export const fetchWords = async (concept, script) => {
  const response = await api.get(`/list/${concept}`, { params: { script } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordData = async (word, script) => {
  const response = await api.get(`/word/${word}`, { params: { script } });
  return convertIntegers(response.data);
};

// Fetch words by form ID
export const fetchWordsByForm = async (formId, script) => {
  try {
    const response = await api.get(`/form/${formId}`, { params: { script } });
    const data = response.data.map(item => convertIntegers(item));

    // Format data based on script setting
    return data.map(item => ({
      ...item,
      label: script === 'both' ? `${item.arabic} / ${item.english}` : item[script],
      id: `word_${item.word_id}`
    }));
  } catch (error) {
    console.error('API error for fetchWordsByForm:', error);
    throw error;
  }
};


// Fetch names of allah for PrimaryList
export const fetchNamesOfAllah = async (script) => {
  const response = await api.get('/list/names_of_allah', { params: { script } });
  return response.data.map(item => convertIntegers(item));
};


// Fetch words, forms, and roots by name ID
export const fetchWordsByNameId = async (nameId, script, corpusId) => {
  const response = await api.get(`/words_by_name/${nameId}`, { params: { script, corpusId } });
  const data = convertIntegers(response.data);

  // Format data based on script setting
  const formatData = (item) => ({
    ...item,
    label: script === 'both' ? `${item.arabic} / ${item.english}` : item[script],
  });

  return {
    ...data,
    words: data.words.map(formatData),
    forms: data.forms.map(formatData),
    roots: data.roots.map(formatData),
  };
};

// Fetch words by root ID
export const fetchRootData = async (rootId, script, corpusId) => {
  try {
    const response = await api.get(`/root/${rootId}`, { params: { script, corpusId } });
    const data = response.data.map(item => convertIntegers(item));

    // Format data based on script setting
    return data.map(item => ({
      ...item,
      label: script === 'both' ? `${item.arabic} / ${item.english}` : item[script],
      id: `word_${item.word_id}`
    }));
  } catch (error) {
    console.error('Error fetching root data:', error);
    throw error;
  }
};

// Fetch words by radicals
export const fetchWordsByRootRadicals = async (r1, r2, r3, script) => {
  const response = await api.get('/words_by_root_radicals', { params: { r1, r2, r3, script } });
  return convertIntegers(response.data);
};

//Fetch roots by radicals
export const fetchRootsByRadicals = async (r1, r2, r3, script) => {
  try {
    const response = await api.get('/roots_by_radicals', {
      params: { r1, r2, r3, script }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching roots by radicals:', error);
    throw error;
  }
};

// Fetch all available corpora
export const fetchCorpora = async () => {
  const response = await api.get('/list/corpora');
  return response.data.map(item => convertIntegers(item));
};