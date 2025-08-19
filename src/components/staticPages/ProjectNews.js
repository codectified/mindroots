import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import changelogContent from '../../content/changelog.md';


const ProjectNews = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(changelogContent)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  return (
    <div className="project-news-container">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default ProjectNews;

