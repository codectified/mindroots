import React, { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';

const CustomListItem = ({ children }) => {
  // Removed the 'color' property to allow inherited or global styling.
  return <li style={{ fontSize: '1em' }}>{children}</li>;
};

const CustomList = ({ children }) => {
  return <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>{children}</ul>;
};

const MarkdownRenderer = ({ filePath }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(filePath)
      .then(response => response.text())
      .then(text => setContent(text));
  }, [filePath]);

  return (
    <div className="markdown-page">
      <div className="markdown-mindroots">
        <Markdown
          options={{
            overrides: {
              li: { component: CustomListItem },
              ul: { component: CustomList },
            },
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;