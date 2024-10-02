import React, { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';
import Menu from '../navigation/Menu';

const CustomListItem = ({ children }) => {
  return <li style={{ fontSize: '1em', color: 'white' }}>{children}</li>;
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
      <Menu />
      <div className="markdown-homepage">
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