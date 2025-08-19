import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import lisanlabContent from '../../content/lisanlab.md';

const LisanLab = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(lisanlabContent)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
      })
      .catch((error) => console.error('Error loading markdown:', error));
  }, []);

  return (
    <div className="about-page">

      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default LisanLab;