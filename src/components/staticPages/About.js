import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import MiniMenu from '../navigation/MiniMenu';
import aboutContent from '../../content/about.md';

const About = () => {
  const [beforeLine12, setBeforeLine12] = useState('');
  const [line12, setLine12] = useState('');
  const [afterLine12, setAfterLine12] = useState('');

  useEffect(() => {
    // Fetch the markdown content
    fetch(aboutContent)
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n'); // Split the content into lines
        setBeforeLine12(lines.slice(0, 11).join('\n')); // Content before line 12
        setLine12(lines[11]); // Line 12 (index 11 in 0-based index)
        setAfterLine12(lines.slice(12).join('\n')); // Content after line 12
      })
      .catch((error) => console.error('Error loading markdown:', error));
  }, []);

  return (
    <div className="about-page">
      <MiniMenu />
      
      {/* Render the content before line 12 */}
      <ReactMarkdown>{beforeLine12}</ReactMarkdown>

      {/* Render the specific line 12 */}
      <ReactMarkdown>{line12}</ReactMarkdown>

      {/* Render the image after line 12 */}
      <div className="graph-image-container">
        <a href="/mindroots/99names.png" target="_blank" rel="noopener noreferrer">
          <img src="/mindroots/99names.png" alt="Graph Overview" className="responsive-image" />
        </a>
      </div>
      
      {/* Render the content after line 12 */}
      <ReactMarkdown>{afterLine12}</ReactMarkdown>
    </div>
  );
};

export default About;