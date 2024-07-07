import axios from 'axios';

// Create an Axios instance with the base URL for the API
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

/**
 * Fetches a list of words from a specific column and script.
 * Used in the Dropdown component to get the list of words based on the selected column and script.
 *
 * @param {string} column - The column to fetch words from (e.g., 'infinitive').
 * @param {string} script - The script to use ('english' or 'arabic').
 * @returns {Promise} - The Axios promise with the list of words.
 */
export const fetchWords = (column, script) => api.get(`/list/${column}`, { params: { script } });

/**
 * Fetches the root data for a specific word and script.
 * Used in the WordList component to fetch related words when a word is selected.
 *
 * @param {string} word - The word to fetch root data for.
 * @param {string} script - The script to use ('english' or 'arabic').
 * @returns {Promise} - The Axios promise with the root data.
 */
export const fetchRootData = (word, script) => api.get(`/root/${word}`, { params: { script } });

/**
 * Fetches the root data for a specific root and script.
 * Used in the WordList component to fetch related words when a root is selected.
 *
 * @param {string} root - The root to fetch data for.
 * @param {string} script - The script to use ('english' or 'arabic').
 * @returns {Promise} - The Axios promise with the root data.
 */
export const fetchRootDataByRoot = (root, script) => api.get(`/root-data/${root}`, { params: { script } });

/**
 * Fetches a list of all root nodes.
 * Used in the Dropdown component to get the initial list of roots.
 *
 * @returns {Promise} - The Axios promise with the list of roots.
 */
export const fetchRoots = () => api.get('/list/roots');

/**
 * Switches the script for a specific root.
 * This endpoint is not used in the current implementation but can be used if needed.
 *
 * @param {string} root - The root to switch scripts for.
 * @param {string} script - The new script to use ('english' or 'arabic').
 * @returns {Promise} - The Axios promise with the switched script data.
 */
export const switchScript = (root, script) => api.get(`/switch-script`, { params: { root, script } });