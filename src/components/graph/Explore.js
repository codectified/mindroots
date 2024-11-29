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
    'Form: infinitive': `
      MATCH (f:Form)
      WHERE f.form_id = 1
      RETURN f
    `,
    'Form: active_participle': `
      MATCH (f:Form)
      WHERE f.form_id = 2
      RETURN f
    `,
    'Form: passive_participle': `
      MATCH (f:Form)
      WHERE f.form_id = 3
      RETURN f
    `,
    'Form: noun_of_place': `
      MATCH (f:Form)
      WHERE f.form_id = 4
      RETURN f
    `,
    'Form: noun_of_state': `
      MATCH (f:Form)
      WHERE f.form_id = 5
      RETURN f
    `,
    'Form: noun_of_instrument': `
      MATCH (f:Form)
      WHERE f.form_id = 6
      RETURN f
    `,
    'Form: noun_of_essence': `
      MATCH (f:Form)
      WHERE f.form_id = 7
      RETURN f
    `,
    'Form: noun_of_hyperbole': `
      MATCH (f:Form)
      WHERE f.form_id = 8
      RETURN f
    `,
    'Form: noun_of_defect': `
      MATCH (f:Form)
      WHERE f.form_id = 9
      RETURN f
    `,
    'Form: Concrete': `
      MATCH (f:Form)
      WHERE f.form_id = 10
      RETURN f
    `,
    'Form: Abstract': `
      MATCH (f:Form)
      WHERE f.form_id = 11
      RETURN f
    `,
    'Form: Movement and Action': `
      MATCH (f:Form)
      WHERE f.form_id = 12
      RETURN f
    `,
    'Form: Human-Animal-Body': `
      MATCH (f:Form)
      WHERE f.form_id = 13
      RETURN f
    `,
    'Form: Hunting-Gathering-Nature': `
      MATCH (f:Form)
      WHERE f.form_id = 14
      RETURN f
    `,
    'Form: Agriculture-Industry': `
      MATCH (f:Form)
      WHERE f.form_id = 15
      RETURN f
    `,
    'Form: Mental States': `
      MATCH (f:Form)
      WHERE f.form_id = 16
      RETURN f
    `,
    'Form: Metaphysical': `
      MATCH (f:Form)
      WHERE f.form_id = 17
      RETURN f
    `,
    'Form: Social': `
      MATCH (f:Form)
      WHERE f.form_id = 18
      RETURN f
    `,
    'Form: Linguistic and Symbolic': `
      MATCH (f:Form)
      WHERE f.form_id = 19
      RETURN f
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
          <optgroup label="Grammatical Forms">
            <option value="Form: infinitive"> Infinitive</option>
            <option value="Form: active_participle"> Active Participle</option>
            <option value="Form: passive_participle"> Passive Participle</option>
            <option value="Form: noun_of_place"> Noun of Place</option>
            <option value="Form: noun_of_state"> Noun of State</option>
            <option value="Form: noun_of_instrument"> Noun of Instrument</option>
            <option value="Form: noun_of_essence"> Noun of Essence</option>
            <option value="Form: noun_of_hyperbole"> Noun of Hyperbole</option>
            <option value="Form: noun_of_defect"> Noun of Defect</option>
          </optgroup>
          <optgroup label="Ontological Forms">
            <option value="Form: Concrete"> Concrete</option>
            <option value="Form: Abstract"> Abstract</option>
            <option value="Form: Movement and Action"> Movement and Action</option>
            <option value="Form: Human-Animal-Body"> Human-Animal-Body</option>
            <option value="Form: Hunting-Gathering-Nature"> Hunting-Gathering-Nature</option>
            <option value="Form: Agriculture-Industry"> Agriculture-Industry</option>
            <option value="Form: Mental States"> Mental States</option>
            <option value="Form: Metaphysical"> Metaphysical</option>
            <option value="Form: Social"> Social</option>
            <option value="Form: Linguistic and Symbolic"> Linguistic and Symbolic</option>
          </optgroup>
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