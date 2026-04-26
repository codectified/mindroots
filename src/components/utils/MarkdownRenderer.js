import React, { useEffect, useState } from 'react';
import Markdown from 'markdown-to-jsx';

const CustomListItem = ({ children }) => {
  return <li>{children}</li>;
};

const CustomList = ({ children }) => {
  return <ul className="pl-5 list-disc">{children}</ul>;
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