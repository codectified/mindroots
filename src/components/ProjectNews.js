import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import changelogContent from '../content/changelog.md';
import Menu from './Menu';


const ProjectNews = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(changelogContent)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  return (
    <div className="project-news-container">
            <Menu />
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default ProjectNews;

