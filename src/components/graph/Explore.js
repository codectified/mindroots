import React, { useState } from 'react';
import GraphVisualization from './GraphVisualization';
import { executeQuery } from '../../services/apiService';
import ReactMarkdown from 'react-markdown';
import wordsContent from '../../content/words.md';
import rootsContent from '../../content/roots.md';
import formsContent from '../../content/forms.md';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { useContextFilter } from '../../contexts/ContextFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import InfoBubble from '../layout/InfoBubble';

const Explore = () => {
  const { L1, L2 } = useLanguage();
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

  const hasActiveFilters = (category) => selectedFilters[category].length > 0;


  const subcategories = {
    word: [
      'Concrete',
      ' Movement and Action',
      ' Human-Animal-Body',
      ' Hunting-Gathering-Nature',
      ' Agriculture-Industry',
      'Abstract',
      ' Mental States',
      ' Metaphysical',
      ' Social',
      ' Linguistic and Symbolic',
    ],
    root: [' Geminate', ' Triliteral', ' Other'],
    form: [
      ' Infinitive',
      ' Active Participle',
      ' Passive Participle',
      ' Noun of Place',
      ' Noun of State',
      ' Noun of Instrument',
      ' Noun of Essence',
      ' Noun of Hyperbole',
      ' Noun of Defect',
      ' Concrete',
      ' Abstract',
      ' Movement and Action',
      ' Human-Animal-Body',
      ' Hunting-Gathering-Nature',
      ' Agriculture-Industry',
      ' Mental States',
      ' Metaphysical',
      ' Social',
      ' Linguistic and Symbolic',
    ],
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
    'Root: Geminate': `
    MATCH (r:Root)
    WHERE r.root_type = 'Geminate'
    RETURN r
    ORDER BY rand()
    LIMIT 1
    `,
    'Root: Triliteral': `
      MATCH (r:Root)
      WHERE r.root_type = 'Triliteral'
      RETURN r
      ORDER BY rand()
      LIMIT 1
    `,
    'Root: Other': `
      MATCH (r:Root)
      WHERE r.root_type IS NULL OR NOT r.root_type IN ['Geminate', 'Triliteral']
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

  
  const loadMarkdownAndFetchData = async (category) => {
    try {
      let content, exampleKey;
      if (category === 'word') {
        content = wordsContent;
        exampleKey = 'words';
      } else if (category === 'root') {
        content = rootsContent;
        exampleKey = 'roots';
      } else if (category === 'form') {
        content = formsContent;
        exampleKey = 'forms';
      }
  
      const response = await fetch(content);
      const text = await response.text();
      setMarkdownContent(text);
  
      // Map filter labels to query keys
      const filterKeyMapping = {
        // Root filters
        ' Geminate Root': 'Root: Geminate',
        ' Triliteral Root': 'Root: Triliteral',
        ' Other Root': 'Root: Other',
      
        // Word filters
        'Concrete Word': 'Concrete Word',
        ' Movement and Action': 'Concrete Word;MAA',
        ' Human-Animal-Body': 'Concrete Word;HAB',
        ' Hunting-Gathering-Nature': 'Concrete Word;HGN',
        ' Agriculture-Industry': 'Concrete Word;AI',
        'Abstract Word': 'Abstract Word',
        ' Mental States': 'Abstract Word;MS',
        ' Metaphysical': 'Abstract Word;MP',
        ' Social': 'Abstract Word;SOC',
        ' Linguistic and Symbolic': 'Abstract Word;LS',
      
        // Form filters
        ' Infinitive': 'Form: infinitive',
        ' Active Participle': 'Form: active_participle',
        ' Passive Participle': 'Form: passive_participle',
        ' Noun of Place': 'Form: noun_of_place',
        ' Noun of State': 'Form: noun_of_state',
        ' Noun of Instrument': 'Form: noun_of_instrument',
        ' Noun of Essence': 'Form: noun_of_essence',
        ' Noun of Hyperbole': 'Form: noun_of_hyperbole',
        ' Noun of Defect': 'Form: noun_of_defect',
        ' Concrete': 'Form: Concrete',
        ' Abstract': 'Form: Abstract',
        ' Movement and Action (Form)': 'Form: Movement and Action',
        ' Human-Animal-Body (Form)': 'Form: Human-Animal-Body',
        ' Hunting-Gathering-Nature (Form)': 'Form: Hunting-Gathering-Nature',
        ' Agriculture-Industry (Form)': 'Form: Agriculture-Industry',
        ' Mental States (Form)': 'Form: Mental States',
        ' Metaphysical (Form)': 'Form: Metaphysical',
        ' Social (Form)': 'Form: Social',
        ' Linguistic and Symbolic (Form)': 'Form: Linguistic and Symbolic',
      };
  
      const activeFilters = selectedFilters[category].length
        ? selectedFilters[category].map((filter) => filterKeyMapping[filter]).filter(Boolean)
        : [exampleKey]; // Default to main category if no filters are selected
  
      const queries = activeFilters.map((filter) => exampleQueries[filter]).filter(Boolean);
      if (queries.length === 0) {
        console.warn('No valid queries to execute.');
        return;
      }
  
      const combinedQuery = queries.join('\nUNION\n');
      const data = await executeQuery(combinedQuery);
      const formattedData = formatNeo4jData(data);
      setGraphData(formattedData);
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

      <h2>Ontological Knowledge Graph Exploration</h2>

      <div className="button-row">
        {/* Word Button */}
        <div className="button-container">
          <button onClick={() => loadMarkdownAndFetchData('word')}>Word</button>
          <button
            className={`submenu-toggle ${hasActiveFilters('word') ? 'active' : ''}`}
            onClick={() => toggleExpanded('word')}
          >
            {expanded.word ? 'v' : '<'}
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
          <button
            className={`submenu-toggle ${hasActiveFilters('root') ? 'active' : ''}`}
            onClick={() => toggleExpanded('root')}
          >
            {expanded.root ? 'v' : '<'}
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
          <button
            className={`submenu-toggle ${hasActiveFilters('form') ? 'active' : ''}`}
            onClick={() => toggleExpanded('form')}
          >
            {expanded.form ? 'v' : '<'}
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
          }}
        />
      )}

      <ReactMarkdown>{markdownContent}</ReactMarkdown>
    </div>
  );
};

export default Explore;