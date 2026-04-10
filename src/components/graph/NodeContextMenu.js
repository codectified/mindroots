import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import '../../styles/node-context-menu.css';
import { useLabels } from '../../hooks/useLabels';

const NodeContextMenu = ({ node, position, onClose, onAction }) => {
  const menuRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const t = useLabels();

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

  // Calculate positioning - viewport-relative (position: fixed), centered on click point
  const getCenteredStyle = () => {
    if (!position) return {};

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;
    const menuWidth = isMobile ? 240 : 200;
    const menuHeight = isMobile ? 200 : 150;
    const margin = 10;

    // Center menu on click point, clamped to viewport bounds
    // position.x/y are clientX/clientY (viewport-relative), matching position: fixed
    const centeredLeft = isMobile ? (viewportWidth - menuWidth) / 2 : position.x - menuWidth / 2;
    const centeredTop = position.y - menuHeight / 2;

    const finalLeft = Math.max(margin, Math.min(centeredLeft, viewportWidth - menuWidth - margin));
    const finalTop = Math.max(margin, Math.min(centeredTop, viewportHeight - menuHeight - margin));

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
          { label: t.moreInfo, action: 'more-info' },
          { label: t.expand, action: 'expand' },
          { label: t.collapse, action: 'collapse' },
          { label: t.inspectNode, action: 'inspect' },
          { label: t.reportIssue, action: 'report' }
        );
        break;
      case 'word':
        options.push(
          { label: t.moreInfo, action: 'more-info' },
          {
            label: t.expand,
            action: 'expand',
            submenu: [
              { label: t.root, action: 'expand-to-root' },
              { label: t.form, action: 'expand-to-form' },
              { label: t.corpusUsage, action: 'expand-to-corpusitems' }
            ]
          },
          { label: t.inspectNode, action: 'inspect' },
          { label: t.reportIssue, action: 'report' }
        );
        break;
      case 'form':
        options.push(
          { label: t.moreInfo, action: 'more-info' },
          { label: t.expand, action: 'expand' },
          { label: t.collapse, action: 'collapse' },
          { label: t.inspectNode, action: 'inspect' },
          { label: t.reportIssue, action: 'report' }
        );
        break;
      case 'corpusitem':
        options.push(
          { label: t.moreInfo, action: 'more-info' },
          { label: t.viewInContext, action: 'view-in-context' },
          { label: t.inspectNode, action: 'inspect' },
          { label: t.reportIssue, action: 'report' }
        );
        break;
      default:
        options.push(
          { label: t.moreInfo, action: 'more-info' },
          { label: t.inspectNode, action: 'inspect' },
          { label: t.reportIssue, action: 'report' }
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
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );

  // Render as portal like InfoBubble
  return ReactDOM.createPortal(menu, document.body);
};

export default NodeContextMenu;