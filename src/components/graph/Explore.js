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

  
  // Multi-select state for filters
  const [selectedFilters, setSelectedFilters] = useState({
    word: [],
    root: [],
    form: [],
  });

  const [expanded, setExpanded] = useState({ word: false, root: false, form: false });

  // Toggle filter selection
  const toggleFilter = (category, filter) => {
    setSelectedFilters((prev) => {
      const filters = prev[category];
      const updatedFilters = filters.includes(filter)
        ? filters.filter((f) => f !== filter)
        : [...filters, filter];
      return { ...prev, [category]: updatedFilters };
    });
  };

  // Toggle expanded menus
  const toggleExpanded = (category) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const subcategories = {
    word: [
      'Concrete Word',
      'Concrete Word;MAA',
      'Concrete Word;HAB',
      'Concrete Word;HGN',
      'Concrete Word;AI',
      'Abstract Word',
      'Abstract Word;MS',
      'Abstract Word;MP',
      'Abstract Word;SOC',
      'Abstract Word;LS',
    ],
    root: ['Geminate Root', 'Triliteral Root', '3+ Root'],
    form: [
      'Form: infinitive',
      'Form: active_participle',
      'Form: passive_participle',
      'Form: noun_of_place',
      'Form: noun_of_state',
      'Form: noun_of_instrument',
      'Form: noun_of_essence',
      'Form: noun_of_hyperbole',
      'Form: noun_of_defect',
      'Form: Concrete',
      'Form: Abstract',
      'Form: Movement and Action',
      'Form: Human-Animal-Body',
      'Form: Hunting-Gathering-Nature',
      'Form: Agriculture-Industry',
      'Form: Mental States',
      'Form: Metaphysical',
      'Form: Social',
      'Form: Linguistic and Symbolic',
    ],
  };


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
    const activeFilters = [
      ...selectedFilters.word,
      ...selectedFilters.root,
      ...selectedFilters.form,
    ];
    
    if (activeFilters.length === 0) {
      alert('Please select at least one filter.');
      return;
    }
  
    try {
      // Determine markdown content based on selected categories
      let content;
      if (selectedFilters.word.length > 0) {
        content = wordsContent;
      } else if (selectedFilters.root.length > 0) {
        content = rootsContent;
      } else if (selectedFilters.form.length > 0) {
        content = formsContent;
      }
  
      if (content) {
        const response = await fetch(content);
        const text = await response.text();
        setMarkdownContent(text);
      } else {
        setMarkdownContent('');
      }
  
      // Combine queries for all selected filters
      const queries = activeFilters.map((filter) => exampleQueries[filter]);
      const combinedQuery = queries.join('\nUNION\n');
  
      // Fetch data from the backend
      const data = await executeQuery(combinedQuery);
      const formattedData = formatNeo4jData(data);
      setGraphData(formattedData);
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

      <div className="button-row">
        {/* Word Button */}
        <div className="button-container">
          <button onClick={() => loadMarkdownAndFetchData('word')}>Word</button>
          <button className="submenu-toggle" onClick={() => toggleExpanded('word')}>
            ▼
          </button>
          {expanded.word && (
            <div className="submenu">
              {subcategories.word.map((filter) => (
                <label key={filter}>
                  <input
                    type="checkbox"
                    checked={selectedFilters.word.includes(filter)}
                    onChange={() => toggleFilter('word', filter)}
                  />
                  {filter}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Root Button */}
        <div className="button-container">
          <button onClick={() => loadMarkdownAndFetchData('root')}>Root</button>
          <button className="submenu-toggle" onClick={() => toggleExpanded('root')}>
            ▼
          </button>
          {expanded.root && (
            <div className="submenu">
              {subcategories.root.map((filter) => (
                <label key={filter}>
                  <input
                    type="checkbox"
                    checked={selectedFilters.root.includes(filter)}
                    onChange={() => toggleFilter('root', filter)}
                  />
                  {filter}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Form Button */}
        <div className="button-container">
          <button onClick={() => loadMarkdownAndFetchData('form')}>Form</button>
          <button className="submenu-toggle" onClick={() => toggleExpanded('form')}>
            ▼
          </button>
          {expanded.form && (
            <div className="submenu">
              {subcategories.form.map((filter) => (
                <label key={filter}>
                  <input
                    type="checkbox"
                    checked={selectedFilters.form.includes(filter)}
                    onChange={() => toggleFilter('form', filter)}
                  />
                  {filter}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <GraphVisualization
        data={graphData}
        onNodeClick={(node, event) =>
          handleNodeClick(node, L1, L2, contextFilterRoot, contextFilterForm, selectedCorpus?.id, event)
        }
      />

      {infoBubble && (
        <InfoBubble
          className="info-bubble"
          definition={infoBubble.definition}
          onClose={() => setInfoBubble(null)}
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