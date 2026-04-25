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
      className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-[800px] w-full max-h-[90vh] shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden">
        <div className="px-[30px] py-5 border-b border-[#eee] flex justify-between items-center bg-surface">
          <h2 className="m-0 text-2xl font-semibold text-ink">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[28px] cursor-pointer text-muted w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-alt transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-[30px] overflow-y-auto flex-1">
          <MarkdownRenderer filePath={filePath} />
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;