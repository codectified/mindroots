import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useGraphData } from '../../contexts/GraphDataContext';
import '../../styles/node-context-menu.css';

const NodeContextMenu = ({ node, position, onClose, onAction }) => {
  const menuRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const { corpusItemEntries, rootEntries } = useGraphData();

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

  // Calculate positioning - desktop follows cursor, mobile centers in viewport
  const getCenteredStyle = () => {
    if (!position) return {};

    // Get viewport dimensions
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;
    
    // Use responsive dimensions
    const menuWidth = isMobile ? 240 : 200;
    const menuHeight = isMobile ? 200 : 150;
    const margin = 10;

    if (isMobile) {
      // Mobile: Center horizontally in viewport, vertically centered on click Y
      const centeredLeft = (viewportWidth - menuWidth) / 2;
      const centeredTop = position.y - menuHeight / 2;
      
      const finalLeft = Math.max(margin, Math.min(centeredLeft, viewportWidth - menuWidth - margin));
      const finalTop = Math.max(margin, Math.min(centeredTop, viewportHeight - menuHeight - margin));

      return {
        left: `${finalLeft}px`,
        top: `${finalTop}px`
      };
    } else {
      // Desktop: Center on cursor position
      const cursorCenteredLeft = position.x - menuWidth / 2;
      const cursorCenteredTop = position.y - menuHeight / 2;
      
      // Keep within viewport bounds
      const finalLeft = Math.max(margin, Math.min(cursorCenteredLeft, viewportWidth - menuWidth - margin));
      const finalTop = Math.max(margin, Math.min(cursorCenteredTop, viewportHeight - menuHeight - margin));

      return {
        left: `${finalLeft}px`,
        top: `${finalTop}px`
      };
    }
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
        
        options.push(
          { label: 'Expand', action: 'expand' },
          { label: 'Collapse', action: 'collapse' }
        );
        
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
          { label: 'Expand to Corpus Items', action: 'expand-to-corpusitems' },
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
        options.push(
          { label: 'Expand', action: 'expand' },
          { label: 'Collapse', action: 'collapse' },
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

  // Helper function to determine submenu positioning
  const getSubmenuClass = () => {
    if (!menuRef.current || !position) return '';
    
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth <= 768;
    const submenuWidth = isMobile ? 120 : 120;
    const margin = 10;
    
    // Calculate if submenu would overflow on either side
    const rightOverflow = menuRect.right + submenuWidth > viewportWidth - margin;
    const leftOverflow = menuRect.left - submenuWidth < margin;
    
    // If both sides would overflow, or if centered would be better, use centered positioning
    if ((rightOverflow && leftOverflow) || (!rightOverflow && !leftOverflow)) {
      return 'centered';
    }
    
    // Otherwise use left-aligned if right would overflow
    return rightOverflow ? 'left-aligned' : '';
  };

  const menuOptions = getMenuOptions();

  const menu = (
    <div ref={menuRef} className="node-context-menu" style={getCenteredStyle()}>
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
              <div className={`context-submenu ${getSubmenuClass()}`}>
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
        
        {/* Close button at the bottom */}
        <div className="context-menu-item">
          <button
            className="context-menu-option"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Render as portal like InfoBubble
  return ReactDOM.createPortal(menu, document.body);
};

export default NodeContextMenu;