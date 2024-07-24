import { fetchWordsByRootRadicals } from '../services/apiService';

const handleRootRadicalChange = async (r1, r2, r3, script, setRootData) => {
  try {
    const response = await fetchWordsByRootRadicals(r1 || '', r2 || '', r3 || '', script);
    if (response.words && response.words.length > 0) {
      const wordNodes = response.words.map(word => ({
        id: `${word[script]}_word`,
        label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script],
        ...word,
        type: 'word'
      }));
      const formNodes = response.forms.map(form => ({
        id: `${form[script]}_form`,
        label: script === 'both' ? `${form.arabic} / ${form.english}` : form[script],
        ...form,
        type: 'form'
      }));
      const rootNodes = response.roots.map(root => ({
        id: `${root[script]}_root`,
        label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script],
        ...root,
        type: 'root'
      }));

      const nodes = [...wordNodes, ...formNodes, ...rootNodes];
      const links = [
        ...response.words.map(word => ({ source: `${r1}${r2}${r3}_root`, target: `${word[script]}_word` })),
        ...response.forms.map(form => ({ source: wordNodes[0]?.id, target: `${form[script]}_form` }))
      ];

      const newData = { nodes, links };
      setRootData(newData);
    } else {
      setRootData({ nodes: [], links: [] }); // Clear graph if no data is found
    }
  } catch (error) {
    console.error('Error fetching words by root radicals:', error);
    setRootData({ nodes: [], links: [] }); // Clear graph in case of error
  }
};

export default handleRootRadicalChange;
