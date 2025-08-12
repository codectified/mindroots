import axios from 'axios';

// // // Create an Axios instance with the base URL for the API
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

export const fetchCorpusItemEntry = async (corpusId, itemId) => {
  try {
    const response = await api.get(`/corpusitementry/${corpusId}/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching corpus item entry:', error);
    throw error;
  }
};

export const fetchRootEntry = async (rootId) => {
  try {
    const response = await api.get(`/rootentry/${rootId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching root entry:', error);
    throw error;
  }
};

// New consolidated expand function
export const expandGraph = async (sourceType, sourceId, targetType, options = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add query parameters
    if (options.L1) params.append('L1', options.L1);
    if (options.L2) params.append('L2', options.L2);
    if (options.corpus_id) params.append('corpus_id', options.corpus_id);
    if (options.limit) params.append('limit', options.limit);
    
    // Add cache buster to prevent stale data when corpus context changes
    params.append('_t', Date.now().toString());
    
    const queryString = params.toString();
    const url = `/expand/${sourceType}/${sourceId}/${targetType}${queryString ? `?${queryString}` : ''}`;
    
    console.log(`Making API request to: ${url}`);
    
    const response = await api.get(url, {
      // Prevent caching of expand requests
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log(`API response status: ${response.status}, data length: ${response.data?.nodes?.length || 0} nodes`);
    return response.data; // Returns { nodes, links }
  } catch (error) {
    console.error('Error expanding graph:', error);
    throw error;
  }
};

/* 
=== BACKEND IMPLEMENTATION GUIDE ===

The new /radical-search endpoint should implement the following Cypher queries based on searchType:

1. 'biradical_only': Only return roots with exactly 2 radicals
MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
WHERE rp.radical IN $radicals AND rp.position IN $positions
WITH root, collect(rp) as matched_radicals
WHERE size(matched_radicals) = size($radicals) AND size((root)-[:HAS_RADICAL]->(:RadicalPosition)) = 2
RETURN root

2. 'exact_match': Return roots that match exactly the specified radicals
MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
WHERE rp.radical IN $radicals AND rp.position IN $positions
WITH root, collect(rp) as matched_radicals
WHERE size(matched_radicals) = size($radicals) AND size((root)-[:HAS_RADICAL]->(:RadicalPosition)) = size($radicals)
RETURN root

3. 'biradical_and_matching_triradical': Return biradicals + triliteral where R3=R2
MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
WHERE rp.radical IN $radicals AND rp.position IN $positions
WITH root, collect(rp) as matched_radicals, size((root)-[:HAS_RADICAL]->(:RadicalPosition)) as root_length
WHERE size(matched_radicals) >= 2 AND (
  (root_length = 2 AND size(matched_radicals) = 2) OR
  (root_length = 3 AND size(matched_radicals) = 3)
)
RETURN root

4. 'extended_and_longer': Return quadriliteral and longer roots
MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
WHERE rp.radical IN $radicals AND rp.position IN $positions
WITH root, collect(rp) as matched_radicals
WHERE size(matched_radicals) = size($radicals) AND size((root)-[:HAS_RADICAL]->(:RadicalPosition)) >= 4
RETURN root

5. 'flexible': Return any roots that match the given radicals (partial matching allowed)
MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
WHERE rp.radical IN $radicals AND rp.position IN $positions
WITH root, collect(rp) as matched_radicals
WHERE size(matched_radicals) = size($radicals)
RETURN root

Parameters should be:
- $radicals: array of radical strings ["ك", "ت", "ب"]  
- $positions: array of position integers [1, 2, 3]
- L1, L2: for language display formatting
*/

// New unified radical search function using RadicalPosition layer
export const fetchRootsByRadicals = async (radicals = [], L1, L2, searchType = 'flexible') => {
  try {
    const response = await api.get('/radical-search', {
      params: { 
        radicals: JSON.stringify(radicals), // [{ radical: 'ك', position: 1 }, { radical: 'ت', position: 2 }]
        L1, 
        L2, 
        searchType 
      },
    });
    return convertIntegers(response.data);
  } catch (error) {
    console.error('Error fetching roots by radicals:', error);
    throw error;
  }
};

// Legacy fetchRootByLetters - now aliases to new radical search for backward compatibility
export const fetchRootByLetters = async (r1, r2, r3, L1, L2, searchType = 'Triliteral') => {
  try {
    // Convert old r1,r2,r3 format to new radicals array format
    const radicals = [];
    if (r1) radicals.push({ radical: r1, position: 1 });
    if (r2) radicals.push({ radical: r2, position: 2 });
    if (r3 && r3 !== 'NoR3') radicals.push({ radical: r3, position: 3 });
    
    // Determine search behavior based on inputs
    let searchBehavior = 'flexible';
    if (r3 === 'NoR3') {
      searchBehavior = 'biradical_only';
    } else if (r3 === r2) {
      searchBehavior = 'biradical_and_matching_triradical';
    } else if (r3) {
      searchBehavior = 'exact_match';
    }
    
    return await fetchRootsByRadicals(radicals, L1, L2, searchBehavior);
  } catch (error) {
    console.error('Error fetching roots by letters:', error);
    throw error;
  }
};

// ===== NEW DISTINCT SEARCH FUNCTIONS MATCHING BACKEND ENDPOINTS =====

// 1. Fetch Root(s) - Position-specific search with wildcards and "None" support
export const fetchRoots = async (r1, r2, r3, L1, L2, limit = 25) => {
  try {
    // Convert empty strings to wildcards for API
    const params = {
      r1: r1 || '*',
      r2: r2 || '*', 
      r3: r3 === 'NoR3' ? 'None' : (r3 || '*'),
      L1,
      L2,
      limit
    };
    
    const response = await api.get('/search-roots', { params });
    return convertIntegers(response.data);
  } catch (error) {
    console.error('Error fetching roots:', error);
    throw error;
  }
};

// 2. Combinate - Return all valid permutations of specified radicals
export const fetchCombinateRoots = async (r1, r2, r3, L1, L2, limit = 25) => {
  try {
    // Only send non-empty radicals
    const params = {
      L1,
      L2,
      limit
    };
    
    if (r1) params.r1 = r1;
    if (r2) params.r2 = r2; 
    if (r3 === 'NoR3') {
      params.r3 = 'None';
    } else if (r3) {
      params.r3 = r3;
    }
    
    const response = await api.get('/search-combinate', { params });
    return convertIntegers(response.data);
  } catch (error) {
    console.error('Error fetching combinate roots:', error);
    throw error;
  }
};

// 3. Fetch Extended - Only roots with 4+ radicals
export const fetchExtendedRootsNew = async (r1, r2, r3, L1, L2, limit = 25) => {
  try {
    // Send all radicals as optional filters
    const params = { L1, L2, limit };
    if (r1) params.r1 = r1;
    if (r2) params.r2 = r2;
    if (r3 && r3 !== 'NoR3') params.r3 = r3;
    
    const response = await api.get('/search-extended', { params });
    return convertIntegers(response.data);
  } catch (error) {
    console.error('Error fetching extended roots:', error);
    throw error;
  }
};

// Legacy functions now using the new radical search system
export const fetchGeminateRoots = async (r1, r2, L1, L2) => {
  try {
    const radicals = [];
    if (r1) radicals.push({ radical: r1, position: 1 });
    if (r2) radicals.push({ radical: r2, position: 2 });
    
    return await fetchRootsByRadicals(radicals, L1, L2, 'biradical_only');
  } catch (error) {
    console.error('Error fetching geminate roots:', error);
    throw error;
  }
};

export const fetchTriliteralRoots = async (r1, r2, r3, L1, L2) => {
  try {
    const radicals = [];
    if (r1) radicals.push({ radical: r1, position: 1 });
    if (r2) radicals.push({ radical: r2, position: 2 });
    if (r3) radicals.push({ radical: r3, position: 3 });
    
    // Determine search type based on input pattern
    let searchType = 'exact_match';
    if (r3 === r2 && r1 && r2) {
      searchType = 'biradical_and_matching_triradical';
    }
    
    return await fetchRootsByRadicals(radicals, L1, L2, searchType);
  } catch (error) {
    console.error('Error fetching triliteral roots:', error);
    throw error;
  }
};

export const fetchExtendedRoots = async (r1, r2, r3, L1, L2) => {
  try {
    const radicals = [];
    if (r1) radicals.push({ radical: r1, position: 1 });
    if (r2) radicals.push({ radical: r2, position: 2 });
    if (r3) radicals.push({ radical: r3, position: 3 });
    
    return await fetchRootsByRadicals(radicals, L1, L2, 'extended_and_longer');
  } catch (error) {
    console.error('Error fetching extended roots:', error);
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

// Placeholder service functions for advanced mode features
export const summarizeNodeContent = async (nodeId, nodeType) => {
  // Placeholder for GPT integration
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`This is a placeholder summary for ${nodeType} node with ID: ${nodeId}. GPT integration will be implemented here.`);
    }, 1000);
  });
};

export const reportNodeIssue = async (nodeId, nodeType, issue) => {
  // Placeholder for issue reporting
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Issue reported for ${nodeType} node (ID: ${nodeId}): ${issue}. Issue tracking system will be implemented here.`);
    }, 500);
  });
};