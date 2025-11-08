import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Markdown from 'markdown-to-jsx';
import '../../styles/article-viewer.css';

const ArticleViewer = () => {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const filePath = searchParams.get('file');
    const titleParam = searchParams.get('title');

    if (filePath) {
      setTitle(titleParam || 'Article');
      fetch(filePath)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load article');
          return res.text();
        })
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading article:', err);
          setError('Failed to load article content');
          setLoading(false);
        });
    } else {
      setError('No article specified');
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="article-viewer-container">
        <div className="article-viewer-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-viewer-container">
        <div className="article-viewer-content">
          <p style={{ color: '#d32f2f' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="article-viewer-container">
      <div className="article-viewer-content">
        <h1 className="article-viewer-title">{title}</h1>
        <div className="article-viewer-body">
          <Markdown
            options={{
              overrides: {
                li: { component: ({ children }) => <li style={{ fontSize: '1em' }}>{children}</li> },
                ul: { component: ({ children }) => <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>{children}</ul> },
              },
            }}
          >
            {content}
          </Markdown>
        </div>
      </div>
    </div>
  );
};

export default ArticleViewer;
