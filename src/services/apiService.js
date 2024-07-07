import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

export const fetchWords = (column, script) => api.get(`/list/${column}`, { params: { script } });
export const fetchRootData = (word, script) => api.get(`/root/${word}`, { params: { script } });
export const switchScript = (root, script) => api.get(`/switch-script`, { params: { root, script } });
export const fetchRoots = async () => {
  const response = await api.get('/list/roots'); // Use the api instance here correctly
  return response;
};
