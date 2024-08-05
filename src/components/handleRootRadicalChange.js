import { fetchRootsByRadicals } from '../services/apiService';

const handleRootRadicalChange = async (r1, r2, r3, script, rootData, setRootData, contextFilter) => {
  try {
    console.log('Fetching roots with radicals:', r1, r2, r3);
    const response = await fetchRootsByRadicals(r1, r2, r3, script);
    console.log('Fetched roots by radicals:', response);

    if (response && response.length > 0) {
      const newNodes = response.map(root => ({
        id: `root_${root.root_id}`,
        label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script],
        ...root,
        type: 'root'
      }));

      const newLinks = []; // Add links if necessary based on your graph structure

      const newData = {
        nodes: [...rootData.nodes, ...newNodes],
        links: [...rootData.links, ...newLinks]
      };

      console.log('New rootData after fetching root radicals:', newData);
      setRootData(newData);
    } else {
      console.log('No data received for the selected radicals');
    }
  } catch (error) {
    console.error('Error fetching roots by radicals:', error);
  }
};

export default handleRootRadicalChange;
