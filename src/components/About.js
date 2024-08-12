import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const About = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/data/about.md')
      .then(response => response.text())
      .then(text => setContent(text));
  }, []);

  return (
    <div>
      <h1>About</h1>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default About;
