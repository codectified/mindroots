import React, { useState, useEffect } from 'react';
import GraphVisualization from '../components/GraphVisualization';
import { executeQuery } from '../services/apiService';
import Menu from '../components/Menu';
import ReactMarkdown from 'react-markdown';
import wordsContent from '../content/words.md';
import rootsContent from '../content/roots.md';
import formsContent from '../content/forms.md';
import introContent from '../content/intro.md';
import { useScript } from '../contexts/ScriptContext';
import { useGraphData } from '../contexts/GraphDataContext';
import { useContextFilter } from '../contexts/ContextFilterContext';
import { useCorpus } from '../contexts/CorpusContext';
import InfoBubble from './InfoBubble';


const Introduction = () => {
  const { L1, L2 } = useScript();
  const { contextFilterRoot, contextFilterForm } = useContextFilter();
  const { selectedCorpus } = useCorpus();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [markdownContent, setMarkdownContent] = useState(''); // State to hold the markdown content
  const [introText, setIntroText] = useState(''); // State to hold the intro markdown content
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

  useEffect(() => {
    // Load the introductory text
    const loadIntroText = async () => {
      try {
        const response = await fetch(introContent);
        const text = await response.text();
        setIntroText(text);
      } catch (error) {
        console.error('Error loading intro markdown:', error);
      }
    };

    loadIntroText();
  }, []);

  const loadMarkdownAndFetchData = async (example) => {
    try {
      let content;
      if (example === 'words') {
        content = wordsContent;
      } else if (example === 'roots') {
        content = rootsContent;
      } else if (example === 'forms') {
        content = formsContent;
      }

      const response = await fetch(content);
      const text = await response.text();
      setMarkdownContent(text);

      const query = exampleQueries[example];
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
    <div className="intro-tutorial">
      <Menu />
      
      {/* Display the intro markdown content */}


      <h3>
  Each button generates a random node. Click/tap each node to explore.  Pan and zoom to adjust view. Scroll down for more information.
</h3>


  <button onClick={() => loadMarkdownAndFetchData('words')}>Words</button>
  <button onClick={() => loadMarkdownAndFetchData('roots')}>Roots</button>
  <button onClick={() => loadMarkdownAndFetchData('forms')}>Forms</button>

      

      <GraphVisualization data={graphData} onNodeClick={(node, event) => handleNodeClick(node, L1, L2, contextFilterRoot, contextFilterForm, selectedCorpus?.id, event)} />


            {/* Render info bubble if infoBubble state is set */}
            {infoBubble && (
        <InfoBubble
        className="info-bubble"
          definition={infoBubble.definition}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
            position: 'absolute', // Ensure it's absolutely positioned in the DOM
          }}
        />
      )}
      <ReactMarkdown>{markdownContent}</ReactMarkdown>
      <ReactMarkdown>{introText}</ReactMarkdown>
    </div>
  );
};

export default Introduction;
