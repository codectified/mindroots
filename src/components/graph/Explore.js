import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GraphVisualization from './GraphVisualization';
import { fetchRandomNodes, expandGraph, inspectNode } from '../../services/apiService';
import ReactMarkdown from 'react-markdown';
import wordsContent from '../../content/words.md';
import rootsContent from '../../content/roots.md';
import formsContent from '../../content/forms.md';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGraphData } from '../../contexts/GraphDataContext';
import { useContextFilter } from '../../contexts/ContextFilterContext';
import { useCorpus } from '../../contexts/CorpusContext';
import { useFormFilter } from '../../contexts/FormFilterContext';
import { useFilter } from '../../contexts/FilterContext';
import { useSemiticLanguageFilter } from '../../contexts/SemiticLanguageFilterContext';
import InfoBubble from '../layout/InfoBubble';

const Explore = () => {
  const location = useLocation();
  const { L1, L2 } = useLanguage();
  const { contextFilterRoot, contextFilterForm } = useContextFilter();
  const { selectedCorpus } = useCorpus();
  const { selectedFormClassifications } = useFormFilter();
  const { filterWordTypes } = useFilter();
  const { selectedSemiticLanguages } = useSemiticLanguageFilter();
  const { graphData, setGraphData, handleNodeClick, infoBubble, setInfoBubble } = useGraphData();
  const [markdownContent, setMarkdownContent] = useState('');

  // Auto-expand root when navigating from analysis
  useEffect(() => {
    const autoExpandRootId = location.state?.autoExpandRootId;
    if (autoExpandRootId) {
      const loadRootGraph = async () => {
        try {
          const result = await expandGraph('root', autoExpandRootId, 'word', { L1, L2 });
          if (result && result.nodes) {
            setGraphData(result);
          }
        } catch (error) {
          console.error('Error auto-expanding root:', error);
        }
      };
      loadRootGraph();
    }
  }, [location.state, L1, L2, setGraphData]);

  // Handle share link parameters (e.g., ?root=2063)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const rootParam = searchParams.get('root');

    if (rootParam) {
      const loadSharedRoot = async () => {
        try {
          // Expand the graph for the root
          const result = await expandGraph('root', rootParam, 'word', { L1, L2 });
          if (result && result.nodes) {
            setGraphData(result);
          }

          // Fetch and display the node data in InfoBubble
          const nodeData = await inspectNode('root', rootParam);
          if (nodeData) {
            setInfoBubble({
              nodeData,
              position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
            });
          }
        } catch (error) {
          console.error('Error loading shared root:', error);
        }
      };
      loadSharedRoot();
    }
  }, [location.search, L1, L2, setGraphData, setInfoBubble]);


  const loadMarkdownAndFetchData = async (category) => {
    try {
      // Load markdown content
      let content;
      if (category === 'word') {
        content = wordsContent;
      } else if (category === 'root') {
        content = rootsContent;
      } else if (category === 'form') {
        content = formsContent;
      }

      const response = await fetch(content);
      const text = await response.text();
      setMarkdownContent(text);

      // Build filter parameters based on category - use global Settings filters
      const filters = { L1, L2 };

      if (category === 'word') {
        // Apply FilterContext (word_type) and SemiticLanguageFilterContext (sem_lang)
        console.log('Word filters - filterWordTypes:', filterWordTypes, 'selectedSemiticLanguages:', selectedSemiticLanguages);

        if (filterWordTypes && filterWordTypes.length > 0) {
          filters.wordTypes = filterWordTypes;
        }
        if (selectedSemiticLanguages && selectedSemiticLanguages.length > 0) {
          filters.semLangs = selectedSemiticLanguages;
        }

        console.log('Final word filters being sent:', filters);
      } else if (category === 'form') {
        // Use FormFilterContext for form classifications
        if (selectedFormClassifications.length > 0) {
          filters.formClassifications = selectedFormClassifications;
        }
      }
      // For root, no filters currently - could add RootTypeFilterContext in future if needed

      // Fetch random node from backend
      const result = await fetchRandomNodes(category, 1, filters);

      if (result && result.nodes) {
        // Append to existing graph data instead of replacing
        setGraphData(prevData => ({
          nodes: [...prevData.nodes, ...result.nodes],
          links: [...prevData.links, ...(result.links || [])]
        }));
      }
    } catch (error) {
      console.error('Error loading markdown or fetching data:', error);
    }
  };

  return (
    <div className="start">

      <h2>Knowledge Graph Exploration</h2>

      <div className="button-row">
        {/* Word Button */}
        <div className="button-container">
          <button onClick={() => loadMarkdownAndFetchData('word')}>Word</button>
        </div>

        {/* Root Button */}
        <div className="button-container">
          <button onClick={() => loadMarkdownAndFetchData('root')}>Root</button>
        </div>

        {/* Form Button */}
        <div className="button-container">
          <button onClick={() => loadMarkdownAndFetchData('form')}>Form</button>
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
          nodeData={infoBubble.nodeData || { definitions: infoBubble.definition }}
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
