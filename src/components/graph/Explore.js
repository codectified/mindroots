import React, { useState } from 'react';
import GraphVisualization from './GraphVisualization';
import { executeQuery } from '../../services/apiService';
import MiniMenu from '../navigation/MiniMenu';
import ReactMarkdown from 'react-markdown';
import wordsContent from '../../content/words.md';
import rootsContent from '../../content/roots.md';
import formsContent from '../../content/forms.md';
import { useScript } from '../../contexts/ScriptContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { useContextFilter } from '../../contexts/ContextFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import InfoBubble from '../layout/InfoBubble';

const Explore = () => {
  const { L1, L2 } = useScript();
  const { contextFilterRoot, contextFilterForm } = useContextFilter();
  const { selectedCorpus } = useCorpus();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [markdownContent, setMarkdownContent] = useState('');
  const [selectedOption, setSelectedOption] = useState(''); // Default is empty for "Select Node Type"
  const closeInfoBubble = () => {
    setInfoBubble(null);
  };

  const exampleQueries = {
    words: `
      MATCH (n:Word)
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Concrete Word': `
      MATCH (n:Word)
      WHERE n.classification = 'Concrete'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Concrete Word;MAA': `
      MATCH (n:Word)
      WHERE n.classification = 'Concrete' AND n.subclass = 'MAA'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Concrete Word;HAB': `
      MATCH (n:Word)
      WHERE n.classification = 'Concrete' AND n.subclass = 'HAB'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Concrete Word;HGN': `
      MATCH (n:Word)
      WHERE n.classification = 'Concrete' AND n.subclass = 'HGN'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Concrete Word;AI': `
      MATCH (n:Word)
      WHERE n.classification = 'Concrete' AND n.subclass = 'AI'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Abstract Word': `
      MATCH (n:Word)
      WHERE n.classification = 'Abstract'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Abstract Word;MS': `
      MATCH (n:Word)
      WHERE n.classification = 'Abstract' AND n.subclass = 'MS'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Abstract Word;MP': `
      MATCH (n:Word)
      WHERE n.classification = 'Abstract' AND n.subclass = 'MP'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Abstract Word;SOC': `
      MATCH (n:Word)
      WHERE n.classification = 'Abstract' AND n.subclass = 'SOC'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    'Abstract Word;LS': `
      MATCH (n:Word)
      WHERE n.classification = 'Abstract' AND n.subclass = 'LS'
      RETURN n
      ORDER BY rand()
      LIMIT 1
    `,
    roots: `
      MATCH (r:Root)
      RETURN r
      ORDER BY rand()
      LIMIT 1
    `,
    forms: `
      MATCH (f:Form)
      RETURN f
      ORDER BY rand()
      LIMIT 1
    `,
  };

  const loadMarkdownAndFetchData = async () => {
    if (!selectedOption) {
      alert('Please select a node type.');
      return;
    }

    try {
      let content;
      if (selectedOption === 'words') {
        content = wordsContent;
      } else if (selectedOption === 'roots') {
        content = rootsContent;
      } else if (selectedOption === 'forms') {
        content = formsContent;
      }

      if (content) {
        const response = await fetch(content);
        const text = await response.text();
        setMarkdownContent(text);
      } else {
        setMarkdownContent('');
      }

      const query = exampleQueries[selectedOption];
      const data = await executeQuery(query);
      const formattedData = formatNeo4jData(data);
      setGraphData(formattedData); // Update graphData for visualization
      console.log('Graph data:', formattedData);
    } catch (error) {
      console.error('Error loading markdown or fetching data:', error);
    }
  };

  const formatNeo4jData = (neo4jData) => {
    const nodes = [];
    const links = [];
  
    neo4jData.forEach(record => {
      Object.values(record).forEach(field => {
        if (field.identity && field.labels) {
          const properties = field.properties;
          nodes.push({
            id: `${properties[L1]}_${field.labels[0].toLowerCase()}`,
            label: L2 === 'off' ? properties[L1] : `${properties[L1]} / ${properties[L2]}`,
            word_id: properties.word_id ? properties.word_id.low : undefined,
            root_id: properties.root_id ? properties.root_id.low : undefined,
            form_id: properties.form_id ? properties.form_id.low : undefined,
            type: field.labels[0].toLowerCase(),
            ...properties
          });
        }
      });
    });
  
    return { nodes, links };
  };

  return (
    <div className="start">
      <MiniMenu />

      <div>
        <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
          <option value="">Select Node Type</option>
          <option value="words">Word</option>
          <option value="Concrete Word">Concrete Word</option>
          <option value="Concrete Word;MAA"> Movement and Action</option>
          <option value="Concrete Word;HAB"> Human-Animal-Body</option>
          <option value="Concrete Word;HGN"> Hunting-Gathering-Nature</option>
          <option value="Concrete Word;AI"> Agriculture-Industry</option>
          <option value="Abstract Word">Abstract Word</option>
          <option value="Abstract Word;MS"> Mental States</option>
          <option value="Abstract Word;MP"> Metaphysical</option>
          <option value="Abstract Word;SOC"> Social</option>
          <option value="Abstract Word;LS"> Linguistic and Symbolic</option>
          <option value="roots">Root</option>
          <option value="forms">Form</option>
        </select>
        <button onClick={loadMarkdownAndFetchData}>Fetch Node</button>
      </div>

      <GraphVisualization 
        data={graphData} 
        onNodeClick={(node, event) => handleNodeClick(node, L1, L2, contextFilterRoot, contextFilterForm, selectedCorpus?.id, event)} 
      />

      {infoBubble && (
        <InfoBubble
          className="info-bubble"
          definition={infoBubble.definition}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
            position: 'absolute',
          }}
        />
      )}

      <ReactMarkdown>{markdownContent}</ReactMarkdown>
    </div>
  );
};

export default Explore;