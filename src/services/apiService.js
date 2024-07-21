import axios from 'axios';

// Create an Axios instance with the base URL for the API
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

export const fetchNamesOfAllah = (script) => api.get('/list/names_of_allah', { params: { script } });

export const fetchRootForName = (name, script) => api.get(`/name/${name}`, { params: { script } });
export const fetchWords = (concept, script) => api.get(`/list/${concept}`, { params: { script } });
export const fetchRootData = (root, script) => api.get(`/root/${root}`, { params: { script } });
export const fetchWordData = (word, script) => api.get(`/word/${word}`, { params: { script } });
export const fetchWordsByForm = (formId, script) => api.get(`/form/${formId}`, { params: { script } });

