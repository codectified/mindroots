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

export const fetchRootData = async (root, script) => {
  const response = await api.get(`/root/${root}`, { params: { script } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordData = async (word, script) => {
  const response = await api.get(`/word/${word}`, { params: { script } });
  return convertIntegers(response.data);
};

export const fetchWordsByForm = async (formId, script) => {
  try {
    const response = await api.get(`/form/${formId}`, { params: { script } });
    console.log('API response for form ID:', formId, response.data);
    return response.data;
  } catch (error) {
    console.error('API error for fetchWordsByForm:', error);
    throw error;
  }
};



export const fetchNamesOfAllah = async (script) => {
  const response = await api.get('/list/names_of_allah', { params: { script } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchRootForName = async (name, script) => {
  const response = await api.get(`/name/${name}`, { params: { script } });
  return convertIntegers(response.data);
};
