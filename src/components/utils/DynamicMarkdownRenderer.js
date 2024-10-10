import React, { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';
import MiniMenu from '../navigation/MiniMenu';
import { useScript } from '../../contexts/ScriptContext';
import { fetchMarkdownFiles } from '../../services/apiService'; // Assumes you have an API service to fetch the list of files

const DynamicMarkdownRenderer = ({ baseFolder }) => {
  const [contents, setContents] = useState([]);
  const { L1 } = useScript();

  useEffect(() => {
    const fetchAllFilesContent = async () => {
      try {
        // Fetch the list of markdown files
        const files = await fetchMarkdownFiles(baseFolder);
        
        // Fetch content for each markdown file
        const fetchedContents = await Promise.all(files.map(async (file) => {
          const response = await fetch(`${baseFolder}/${file}`);
          const text = await response.text();

          // Extract content without front matter
          const frontMatterMatch = text.match(/---\n([\s\S]+?)\n---/);
          let contentWithoutFrontMatter = text;

          if (frontMatterMatch) {
            contentWithoutFrontMatter = text.replace(frontMatterMatch[0], '').trim();
          }

          return contentWithoutFrontMatter;
        }));

        setContents(fetchedContents);
      } catch (error) {
        console.error('Error loading markdown files:', error);
      }
    };

    fetchAllFilesContent();
  }, [baseFolder]);

  const filterContentByLanguage = (text) => {
    const languageTag = L1 === 'arabic' ? '~ARABIC~' : '~ENGLISH~';
    const regex = new RegExp(`${languageTag}\\s*([\\s\\S]*?)(?=~|$)`, 'g');
    const match = text.match(regex);

    return match ? match[0].replace(languageTag, '').trim() : text.trim();
  };

  return (
    <div className={`markdown-page ${L1 === 'arabic' ? 'rtl' : 'ltr'}`}>
      <div className={`markdown-homepage ${L1 === 'arabic' ? 'rtl' : 'ltr'}`}>
        <MiniMenu />
        <br></br>
        <br></br>

        {contents.map((content, index) => (
          <Markdown key={index} options={{ forceBlock: true }}>
            {filterContentByLanguage(content)}
          </Markdown>
        ))}
      </div>
    </div>
  );
};



export default DynamicMarkdownRenderer;