import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useGraphData } from '../../contexts/GraphDataContext';
import '../../styles/node-context-menu.css';

const NodeContextMenu = ({ node, position, onClose, onAction }) => {
  const menuRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const { corpusItemEntries, rootEntries, graphData } = useGraphData();

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

  // Calculate positioning to match InfoBubble behavior
  const getCenteredStyle = () => {
    if (!position) return {};

    // Get viewport dimensions
    const viewportWidth = document.documentElement.clientWidth;
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 150; // Approximate menu height

    // X: Center horizontally in viewport (like InfoBubble)
    const centeredLeft = (viewportWidth - menuWidth) / 2;

    // Y: Offset by half menu height to center on click Y coordinate (like InfoBubble)
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

  // Helper function to determine if a node is currently expanded
  const isNodeExpanded = (node) => {
    if (!node || !graphData) return false;
    
    // For root nodes, check if there are any word nodes with matching root_id
    if (node.type === 'root') {
      const rootId = node.root_id?.low !== undefined ? node.root_id.low : node.root_id;
      return graphData.nodes.some(n => 
        n.type === 'word' && 
        (n.root_id?.low === rootId || n.root_id === rootId)
      );
    }
    
    // For form nodes, check if there are any word nodes with matching form_id
    if (node.type === 'form') {
      const formId = node.form_id?.low !== undefined ? node.form_id.low : node.form_id;
      return graphData.nodes.some(n => 
        n.type === 'word' && 
        (n.form_id?.low === formId || n.form_id === formId)
      );
    }
    
    return false;
  };

  // Get menu options based on node type
  const getMenuOptions = () => {
    if (!node) return [];

    const options = [];
    const nodeType = node.type;

    switch (nodeType) {
      case 'root':
        // Check if entry exists for this root
        const rootId = node.root_id?.low !== undefined ? node.root_id.low : node.root_id;
        const hasRootEntry = rootEntries[rootId] !== null && rootEntries[rootId] !== undefined;
        const isExpanded = isNodeExpanded(node);
        
        // Add expand/collapse toggle
        options.push({
          label: isExpanded ? 'Collapse' : 'Expand',
          action: isExpanded ? 'collapse' : 'expand'
        });
        
        if (hasRootEntry) {
          options.push({ label: 'Entry', action: 'root-entry' });
        }
        
        options.push(
          { label: 'Summarize', action: 'summarize' },
          { label: 'Report Issue', action: 'report' }
        );
        break;
      case 'word':
        options.push(
          { 
            label: 'Entries', 
            action: 'entries',
            submenu: [
              { label: 'Lane', action: 'lane-entry' },
              { label: 'Hans Wehr', action: 'hanswehr-entry' }
            ]
          },
          { label: 'Summarize', action: 'summarize' },
          { label: 'Report Issue', action: 'report' }
        );
        break;
      case 'form':
        const isFormExpanded = isNodeExpanded(node);
        
        // Add expand/collapse toggle
        options.push({
          label: isFormExpanded ? 'Collapse' : 'Expand',
          action: isFormExpanded ? 'collapse' : 'expand'
        });
        
        options.push(
          { label: 'Summarize', action: 'summarize' },
          { label: 'Report Issue', action: 'report' }
        );
        break;
      case 'name': // corpus item nodes
        // Check if entry exists for this corpus item
        const corpusItemId = node.item_id?.low !== undefined ? node.item_id.low : node.item_id;
        const corpusId = node.corpus_id?.low !== undefined ? node.corpus_id.low : node.corpus_id;
        const entryKey = `${corpusId}_${corpusItemId}`;
        const hasEntry = corpusItemEntries[entryKey] !== null && corpusItemEntries[entryKey] !== undefined;
        
        if (hasEntry) {
          options.push({ label: 'Entry', action: 'corpus-item-entry' });
        }
        options.push({ label: 'Report Issue', action: 'report' });
        break;
      default:
        options.push(
          { label: 'Report Issue', action: 'report' }
        );
    }

    return options;
  };

  const handleOptionClick = (option) => {
    if (option.submenu) {
      // Toggle submenu visibility
      setOpenSubmenu(openSubmenu === option.action ? null : option.action);
    } else {
      // Execute action and close menu
      onAction(option.action, node);
      onClose();
    }
  };

  const handleSubmenuClick = (action) => {
    onAction(action, node);
    onClose();
  };

  const menuOptions = getMenuOptions();

  const menu = (
    <div ref={menuRef} className="node-context-menu" style={getCenteredStyle()}>
      <button
        className="context-menu-close-button"
        onClick={onClose}
        aria-label="Close Context Menu"
      >
        ×
      </button>
      <div className="node-context-menu-content">
        {menuOptions.map((option, index) => (
          <div key={index} className="context-menu-item">
            <button
              className={`context-menu-option ${option.submenu ? 'has-submenu' : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
              {option.submenu && <span className="submenu-arrow">▶</span>}
            </button>
            
            {/* Render submenu if it exists and is open */}
            {option.submenu && openSubmenu === option.action && (
              <div className="context-submenu">
                {option.submenu.map((subOption, subIndex) => (
                  <button
                    key={subIndex}
                    className="context-submenu-option"
                    onClick={() => handleSubmenuClick(subOption.action)}
                  >
                    {subOption.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render as portal like InfoBubble
  return ReactDOM.createPortal(menu, document.body);
};

export default NodeContextMenu;