import axios from 'axios';

// Create an Axios instance with the base URL for the API
const api = axios.create({
  baseURL: 'https://theoption.life/api',
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

export const fetchWordsByFormWithLexicon = async (formId, script) => {
  const endpoint = `/form/${formId}/lexicon`;
  const response = await api.get(endpoint, { params: { script } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordsByFormWithCorpus = async (formId, corpusId, script) => {
  const endpoint = `/form/${formId}/corpus/${corpusId}`;
  const response = await api.get(endpoint, { params: { script } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordsByRootWithLexicon = async (rootId, script) => {
  const endpoint = `/root/${rootId}/lexicon`;
  const response = await api.get(endpoint, { params: { script } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordsByRootWithCorpus = async (rootId, corpusId, script) => {
  const endpoint = `/root/${rootId}/corpus/${corpusId}`;
  const response = await api.get(endpoint, { params: { script } });
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
export const fetchWordsByCorpusItem = async (itemId, corpusId, script) => {
  const response = await api.get(`/words_by_corpus_item/${itemId}`, { params: { corpusId, script } });
  const data = convertIntegers(response.data);

  // Ensure all expected data is defined and available
  return {
    ...data,
    words: data.words ? data.words.map(word => ({
      ...word,
      label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script],
    })) : [],
    forms: data.forms ? data.forms.map(form => ({
      ...form,
      label: script === 'both' ? `${form.arabic} / ${form.english}` : form[script],
    })) : [],
    roots: data.roots ? data.roots.map(root => ({
      ...root,
      label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script],
    })) : [],
  };
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