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

export const fetchWordsByForm = async (formId, script) => {
  try {
    const response = await api.get(`/form/${formId}`, { params: { script } });
    const data = response.data.map(item => convertIntegers(item));
    if (script === 'both') {
      return data.map(item => ({
        ...item,
        label: `${item.arabic} / ${item.english}`
      }));
    }
    return data;
  } catch (error) {
    console.error('API error for fetchWordsByForm:', error);
    throw error;
  }
};


export const fetchNamesOfAllah = async (script) => {
  const response = await api.get('/list/names_of_allah', { params: { script } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordsByNameId = async (nameId, script) => {
  const response = await api.get(`/words_by_name/${nameId}`, { params: { script } });
  return convertIntegers(response.data);
};


export const fetchRootData = async (rootId, script) => {
  try {
    const response = await api.get(`/root/${rootId}`, { params: { script } });
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

export const fetchWordsByRootRadicals = async (r1, r2, r3, script) => {
  const response = await api.get('/words_by_root_radicals', { params: { r1, r2, r3, script } });
  return convertIntegers(response.data);
};

