import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useLabels } from '../../hooks/useLabels';

const menuOptionCls =
  'w-full bg-[#f8f9fa] border border-[#ddd] rounded text-[#333] text-center cursor-pointer font-serif ' +
  'text-[15px] py-[10px] px-3 min-h-[40px] transition-[background-color,border-color] duration-200 ' +
  'md:text-[14px] md:py-2 md:min-h-0 ' +
  'hover:bg-[#e9ecef] hover:border-[#adb5bd] active:bg-[#dee2e6] active:translate-y-px ' +
  'focus:outline-none focus:border-[#666] focus:shadow-[0_0_0_2px_rgba(102,102,102,0.2)]';

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

    const centeredLeft = isMobile ? (viewportWidth - menuWidth) / 2 : position.x - menuWidth / 2;
    const centeredTop = position.y - menuHeight / 2;

    const finalLeft = Math.max(margin, Math.min(centeredLeft, viewportWidth - menuWidth - margin));
    const finalTop = Math.max(margin, Math.min(centeredTop, viewportHeight - menuHeight - margin));

    return {
      left: `${finalLeft}px`,
      top: `${finalTop}px`
    };
  };

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
      setOpenSubmenu(openSubmenu === option.action ? null : option.action);
    } else {
      onAction(option.action, node);
      onClose();
    }
  };

  const handleSubmenuClick = (action) => {
    onAction(action, node);
    onClose();
  };

  const getSubmenuPositionCls = () => {
    if (!menuRef.current || !position) return 'left-[calc(100%-5px)]';

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const submenuWidth = 120;
    const margin = 10;

    const rightOverflow = menuRect.right + submenuWidth > viewportWidth - margin;
    const leftOverflow = menuRect.left - submenuWidth < margin;

    if ((rightOverflow && leftOverflow) || (!rightOverflow && !leftOverflow)) {
      return 'left-1/2 -translate-x-1/2 top-full mt-[5px]';
    }

    return rightOverflow ? 'left-auto right-[calc(100%-5px)]' : 'left-[calc(100%-5px)]';
  };

  const menuOptions = getMenuOptions();

  const menu = (
    <div
      ref={menuRef}
      className="fixed bg-white border border-[#ccc] rounded-[5px] w-[240px] max-w-[80vw] max-h-[70vh] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.2)] z-[1000] font-serif md:w-[200px] md:min-h-[120px] md:max-w-[90vw] md:p-[10px] md:max-h-none"
      style={getCenteredStyle()}
    >
      <div className="flex flex-col gap-2">
        {menuOptions.map((option, index) => (
          <div key={index} className="relative">
            <button
              className={`${menuOptionCls} ${option.submenu ? 'flex justify-between items-center' : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
              {option.submenu && <span className="text-[12px] text-[#666] ml-2">▶</span>}
            </button>

            {option.submenu && openSubmenu === option.action && (
              <div className={`absolute top-0 min-w-[120px] max-w-[60vw] bg-white border border-[#ccc] rounded p-1 shadow-[2px_2px_8px_rgba(0,0,0,0.15)] z-[1001] md:max-w-none ${getSubmenuPositionCls()}`}>
                {option.submenu.map((subOption, subIndex) => (
                  <button
                    key={subIndex}
                    className="block w-full bg-[#f8f9fa] border border-[#ddd] rounded-[3px] py-2 px-[10px] my-0.5 cursor-pointer font-serif text-[14px] text-[#333] text-center transition-colors duration-200 md:py-[6px] md:text-[13px] hover:bg-[#e9ecef] hover:border-[#adb5bd] active:bg-[#dee2e6]"
                    onClick={() => handleSubmenuClick(subOption.action)}
                  >
                    {subOption.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Close button */}
        <div className="relative">
          <button className={menuOptionCls} onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(menu, document.body);
};

export default NodeContextMenu;
