import { useEffect, useState } from 'react';
import MarkdownRenderer from '../utils/MarkdownRenderer';

const ArticleModal = ({ filePath, title, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (filePath) {
      setIsVisible(true);
    }
  }, [filePath]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            padding: '20px 30px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8f9fa'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#333' }}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#666',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            ×
          </button>
        </div>
        <div 
          style={{
            padding: '30px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          <MarkdownRenderer filePath={filePath} />
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;