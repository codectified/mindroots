import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import InfoBubble from '../layout/InfoBubble';

const LisanLabReports = () => {
  const [content, setContent] = useState('');
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [reportFilePath, setReportFilePath] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [bubblePosition, setBubblePosition] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    // Load the main reports list markdown
    fetch('/mindroots/lisanlab-reports/lisanlab-reports.md')
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
      })
      .catch((error) => console.error('Error loading reports list:', error));
  }, []);

  // Intercept link clicks and open in InfoBubble
  const handleLinkClick = (event) => {
    const target = event.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');

    // Check if it's a link to a report file (.md or .txt)
    if (href && (href.endsWith('.md') || href.endsWith('.txt'))) {
      event.preventDefault();

      // Extract title from link text
      const title = target.textContent;

      // Calculate bubble position from click
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const bubbleWidth = 600;
      const bubbleHeight = 500;

      let top = event.clientY;
      let left = (viewportWidth - bubbleWidth) / 2;

      // Ensure bubble doesn't go off screen
      if (top + bubbleHeight > viewportHeight) {
        top = viewportHeight - bubbleHeight - 20;
      }
      if (top < 20) {
        top = 20;
      }
      if (left < 20) {
        left = 20;
      }
      if (left + bubbleWidth > viewportWidth) {
        left = viewportWidth - bubbleWidth - 20;
      }

      setBubblePosition({
        top: `${top}px`,
        left: `${left}px`
      });

      setReportFilePath(href);
      setReportTitle(title);
      setShowInfoBubble(true);
    }
  };

  return (
    <div className="about-page" onClick={handleLinkClick}>
      <ReactMarkdown>{content}</ReactMarkdown>

      {/* InfoBubble for displaying report content */}
      {showInfoBubble && (
        <InfoBubble
          filePath={reportFilePath}
          title={reportTitle}
          onClose={() => setShowInfoBubble(false)}
          style={{
            top: bubblePosition.top,
            left: bubblePosition.left,
            position: 'fixed',
            zIndex: 9999
          }}
        />
      )}
    </div>
  );
};

export default LisanLabReports;
