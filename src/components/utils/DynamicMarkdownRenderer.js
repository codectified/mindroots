import React, { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';
import { useScript } from '../../contexts/ScriptContext';
import { fetchMarkdownFiles } from '../../services/apiService';

const DynamicMarkdownRenderer = ({ baseFolder }) => {
  const [contents, setContents] = useState([]);
  const { L1, setL1 } = useScript();

  useEffect(() => {
    const fetchAllFilesContent = async () => {
      try {
        // Fetch the list of markdown files
        const files = await fetchMarkdownFiles(baseFolder);
        
        // Fetch content for each markdown file
        const fetchedContents = await Promise.all(files.map(async (file) => {
          const response = await fetch(`${baseFolder}/${file}`);
          const text = await response.text();

          // Extract front matter and content
          const frontMatterMatch = text.match(/---\n([\s\S]+?)\n---/);
          let contentWithoutFrontMatter = text;
          let date = null;

          if (frontMatterMatch) {
            const frontMatter = frontMatterMatch[1];
            contentWithoutFrontMatter = text.replace(frontMatterMatch[0], '').trim();
            const dateMatch = frontMatter.match(/date:\s*"([\d-]+)"/);
            date = dateMatch ? new Date(dateMatch[1]) : null;
          }

          return { content: contentWithoutFrontMatter, date, file };
        }));

        // Separate home.md from other contents
        const homeContent = fetchedContents.find((item) => item.file === 'home.md');
        const otherContents = fetchedContents.filter((item) => item.file !== 'home.md');

        // Sort other contents by date (newest first)
        const sortedOtherContents = otherContents.sort((a, b) => {
          if (a.date && b.date) {
            return b.date - a.date;
          }
          return 0;
        });

        // Assemble final contents array with home.md first
        setContents(homeContent ? [homeContent, ...sortedOtherContents] : sortedOtherContents);
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

  const toggleLanguage = () => {
    setL1((prevL1) => (prevL1 === 'arabic' ? 'english' : 'arabic'));
  };

  return (
    <div>
      <div className="language-toggle">
        <div className={`toggle-slider ${L1 === 'arabic' ? 'active-ar' : 'active-en'}`} onClick={toggleLanguage}>
          <span className={L1 === 'arabic' ? 'selected' : 'unselected'}>AR</span>
          <span className={L1 === 'english' ? 'selected' : 'unselected'}>EN</span>
        </div>
      </div>
  
      {/* <a href="/mindroots" className="mindroots-button">
        <img src={`${process.env.PUBLIC_URL}/root-tree.jpeg`} alt="Mindroots" className="button-icon" />
      </a> */}
  <br></br>
      <div className={`markdown-page ${L1 === 'arabic' ? 'rtl' : 'ltr'}`}>
        {contents.map((content, index) => (
          <div key={index} className={`markdown-homepage ${L1 === 'arabic' ? 'rtl' : 'ltr'}`}>
            <Markdown options={{ forceBlock: true }}>
              {filterContentByLanguage(content.content)}
            </Markdown>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicMarkdownRenderer;