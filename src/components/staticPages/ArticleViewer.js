import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Markdown from 'markdown-to-jsx';

const CustomListItem = ({ children }) => {
  return <li style={{ fontSize: '1em' }}>{children}</li>;
};

const CustomList = ({ children }) => {
  return <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>{children}</ul>;
};

const ArticleViewer = () => {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convert bullet characters to markdown list syntax
  const preprocessContent = (text) => {
    // Convert lines that start with tab + bullet + tab to markdown list syntax
    return text.split('\n').map((line) => {
      // Match lines like "\t•\ttext" and convert to "- text"
      const bulletMatch = line.match(/^\t+•\t+(.+)$/);
      if (bulletMatch) {
        return `- ${bulletMatch[1]}`;
      }
      return line;
    }).join('\n');
  };

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
          const processedContent = preprocessContent(text);
          setContent(processedContent);
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
      <div className="markdown-page">
        <div className="markdown-mindroots">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="markdown-page">
        <div className="markdown-mindroots">
          <p style={{ color: '#d32f2f' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-page">
      <div className="markdown-mindroots">
        <h1>{title}</h1>
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

export default ArticleViewer;
