import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Menu from './Menu';
import aboutContent from '../content/about.md'; // Import the markdown file path

const About = () => {
  const [beforeLine37, setBeforeLine37] = useState('');
  const [line37, setLine37] = useState('');
  const [afterLine37, setAfterLine37] = useState('');

  useEffect(() => {
    // Fetch the markdown content
    fetch(aboutContent)
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n'); // Split the content into lines
        setBeforeLine37(lines.slice(0, 36).join('\n')); // Content before line 37
        setLine37(lines[36]); // Line 37 (index 36 in 0-based index)
        setAfterLine37(lines.slice(37).join('\n')); // Content after line 37
      })
      .catch((error) => console.error('Error loading markdown:', error));
  }, []);

  return (
    <div className="about-page">
      <Menu />
      
      {/* Render the content before line 37 */}
      <ReactMarkdown>{beforeLine37}</ReactMarkdown>

      <div className="graph-image-container">
        <a href="/mindroots/99names.png" target="_blank" rel="noopener noreferrer">
          <img src="/mindroots/99names.png" alt="Graph Overview" className="responsive-image" />
        </a>
      </div>
      
      {/* Render the specific line 37 */}
      <ReactMarkdown>{line37}</ReactMarkdown>

      {/* Render the content after line 37 */}
      <ReactMarkdown>{afterLine37}</ReactMarkdown>
    </div>
  );
};

export default About;