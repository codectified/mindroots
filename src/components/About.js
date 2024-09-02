import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Menu from './Menu';
import aboutContent from '../content/about.md'; // Import the markdown file path

const About = () => {
  const [blurb, setBlurb] = useState('');

  useEffect(() => {
    // Fetch the markdown content
    fetch(aboutContent)
      .then((res) => res.text())
      .then((text) => setBlurb(text))
      .catch((error) => console.error('Error loading markdown:', error));
  }, []);

  return (
    <div className="about-page">
      <Menu />
      <ReactMarkdown>{blurb}</ReactMarkdown>

      <h2>Database Overview</h2>
      <div className="graph-image-container">
        <a href="/mindroots/99names.png" target="_blank" rel="noopener noreferrer">
          <img src="/mindroots/99names.png" alt="Graph Overview" className="responsive-image" />
        </a>
      </div>
    </div>
  );
};

export default About;