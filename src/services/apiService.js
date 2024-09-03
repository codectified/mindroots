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

export const fetchWordsByFormWithLexicon = async (formId, L1, L2) => {
  const endpoint = `/form/${formId}/lexicon`;
  const response = await api.get(endpoint, { params: { L1, L2 } });
  return response.data.map(item => convertIntegers(item));
};

export const fetchWordsByFormWithCorpus = async (formId, corpusId, L1, L2) => {
  const endpoint = `/form/${formId}/corpus/${corpusId}`;
  const response = await api.get(endpoint, { params: { L1, L2 } });
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

export const fetchDefinitionsByWord = async (wordId, L1, L2) => {
  try {
    const response = await api.get(`/definitionsbyword/${wordId}`, {
      params: { L1, L2 }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching definitions by word:', error);
    throw error;
  }
};