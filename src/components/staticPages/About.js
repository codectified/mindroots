import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../../content/about.md';

const About = () => {
  const [beforeImage, setBeforeImage] = useState('');
  const [afterImage, setAfterImage] = useState('');

  useEffect(() => {
    fetch(aboutContent)
      .then((res) => res.text())
      .then((text) => {
        const [before, after] = text.split('<!-- IMAGE_HERE -->');
        setBeforeImage(before);
        setAfterImage(after);
      })
      .catch((error) => console.error('Error loading markdown:', error));
  }, []);

  return (
    <div className="about-page">

      <ReactMarkdown>{beforeImage}</ReactMarkdown>

      <div className="graph-image-container">
        <a href="/language-mirror.png" target="_blank" rel="noopener noreferrer">
          <img src="/language-mirror.png" alt="Graph Overview" className="responsive-image" />
        </a>
      </div>

      <ReactMarkdown>{afterImage}</ReactMarkdown>
    </div>
  );
};

export default About;