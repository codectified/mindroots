import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../styles/node-context-menu.css';

const NodeContextMenu = ({ node, position, onClose, onAction }) => {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Calculate centered positioning similar to InfoBubble
  const getCenteredStyle = () => {
    if (!position) return {};

    // Get viewport dimensions
    const viewportWidth = document.documentElement.clientWidth;
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 150; // Approximate menu height

    // X: Center horizontally in viewport
    const centeredLeft = (viewportWidth - menuWidth) / 2;

    // Y: Center vertically on click Y coordinate, offset by half menu height
    const centeredTop = position.y - menuHeight / 2;

    // Keep within viewport bounds
    const margin = 10;
    const finalLeft = Math.max(margin, Math.min(centeredLeft, viewportWidth - menuWidth - margin));
    const finalTop = Math.max(margin, Math.min(centeredTop, window.innerHeight - menuHeight - margin));

    return {
      left: `${finalLeft}px`,
      top: `${finalTop}px`
    };
  };

  // Get menu options based on node type
  const getMenuOptions = () => {
    if (!node) return [];

    const options = [];
    const nodeType = node.type;

    switch (nodeType) {
      case 'root':
        options.push(
          { label: 'Expand', action: 'expand' },
          { label: 'Collapse', action: 'collapse' },
          { label: 'Summarize', action: 'summarize' },
          { label: 'Report Issue', action: 'report' }
        );
        break;
      case 'word':
        options.push(
          { label: 'Summarize', action: 'summarize' },
          { label: 'Report Issue', action: 'report' }
        );
        break;
      case 'form':
        options.push(
          { label: 'Expand', action: 'expand' },
          { label: 'Collapse', action: 'collapse' },
          { label: 'Summarize', action: 'summarize' },
          { label: 'Report Issue', action: 'report' }
        );
        break;
      case 'name': // corpus item nodes
        options.push(
          { label: 'Report Issue', action: 'report' }
        );
        break;
      default:
        options.push(
          { label: 'Report Issue', action: 'report' }
        );
    }

    return options;
  };

  const handleOptionClick = (action) => {
    onAction(action, node);
    onClose();
  };

  const menuOptions = getMenuOptions();

  const menu = (
    <div ref={menuRef} className="node-context-menu" style={getCenteredStyle()}>
      <div className="node-context-menu-header">
        <span className="node-context-menu-title">{node?.type} Node</span>
        <button
          className="context-menu-close-button"
          onClick={onClose}
          aria-label="Close Context Menu"
        >
          ×
        </button>
      </div>
      <div className="node-context-menu-content">
        {menuOptions.map((option, index) => (
          <button
            key={index}
            className="context-menu-option"
            onClick={() => handleOptionClick(option.action)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  // Render as portal like InfoBubble
  return ReactDOM.createPortal(menu, document.body);
};

export default NodeContextMenu;