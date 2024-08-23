import React, { useState, useEffect } from 'react';
import GraphVisualization from './GraphVisualization';
import { executeQuery } from '../services/apiService';
import Menu from './Menu';
import handleWordNodeClick from './handleWordNodeClick';
import handleRootNodeClick from './handleRootNodeClick';
import handleFormNodeClick from './handleFormNodeClick';
import { useScript } from '../contexts/ScriptContext';
import { useGraphData } from '../contexts/GraphDataContext';
import { useContextFilter } from '../contexts/ContextFilterContext';
import { useCorpus } from '../contexts/CorpusContext';

const About = () => {
  const { L1, L2 } = useScript();
  const { contextFilterRoot, contextFilterForm } = useContextFilter();
  const { selectedCorpus } = useCorpus();
  const { graphData, setGraphData } = useGraphData();
  const [selectedExample, setSelectedExample] = useState('words'); // Default to words

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
    const fetchData = async () => {
      try {
        const query = exampleQueries[selectedExample];
        const data = await executeQuery(query);
        const formattedData = formatNeo4jData(data);
        setGraphData(formattedData); // Update graphData for visualization
        console.log('Initial graphData:', formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [selectedExample, setGraphData]);
  

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

  const handleNodeClick = async (node) => {
    const corpusId = selectedCorpus ? selectedCorpus.id : null;

    if (node.type === 'word') {
      await handleWordNodeClick(node, L1, L2, graphData, setGraphData, corpusId);
    } else if (node.type === 'root') {
      await handleRootNodeClick(node, L1, L2, graphData, setGraphData, contextFilterRoot, corpusId);
    } else if (node.type === 'form') {
      await handleFormNodeClick(node, L1, L2, graphData, setGraphData, contextFilterForm, corpusId);
    }
  };

  const exampleTexts = {
    words: "All words have essential sounds and structure; a root and a form. Click the word once to see its root. Click the root again to see its form.",
    roots: "Roots are the essential sounds of a word. A single root can be shared by as many as 15 or more unique words and even double or triple this amount of different verbal and nominal conjugations. Root derivations are restricted to the most common nominal forms in the current version. Click on a root to see its related words.",
    forms: "Forms are the skeleton of a word, if the root is its heart. Forms can be shared by hundreds of different words from different roots. Click the form below to see its related words. Since it's too difficult to evaluate so many words at once, form node expansion can be limited in the settings by adjusting the Form Filter Context to the different available corpora."
  };

  return (
    <div className="about-page">
      <Menu />
      <h1>The Basic Elements</h1>
      <p>
        MindRoots is a graphical ontological dictionary application that allows users to explore the relationships between words and other parts of language.  The basic elements are spoken words and their roots and forms.
      </p>

      <div>
        <button onClick={() => setSelectedExample('words')}>Words</button>
        <button onClick={() => setSelectedExample('roots')}>Roots</button>
        <button onClick={() => setSelectedExample('forms')}>Forms</button>
      </div>

      <p>{exampleTexts[selectedExample]}</p>

      <GraphVisualization data={graphData} onNodeClick={handleNodeClick} />
    </div>
  );
};

export default About;
