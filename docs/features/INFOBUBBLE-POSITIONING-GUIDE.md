# InfoBubble Positioning Guide

**Date Created**: September 16, 2025  
**Status**: Production Reference  
**Purpose**: Document all InfoBubble positioning patterns to prevent recurring positioning issues

---

## Overview

InfoBubble is a reusable component that displays detailed information in a modal overlay. It requires proper positioning to appear in the correct location relative to user interactions.

## Common Issue

**Problem**: InfoBubble appears "almost offscreen to the bottom left" instead of following clicks or appearing in sensible locations.

**Root Cause**: InfoBubble component expects a `style` prop with positioning coordinates. When not provided, it defaults to position (0,0) which appears in the bottom left.

## Four Positioning Patterns

### 1. **Smart Click-Based Positioning** (Recommended for UI buttons)

**Use Case**: When InfoBubble should appear near user click but stay readable
**Implementation**: Horizontal centering with vertical click following + boundary clamping

```javascript
const [bubblePosition, setBubblePosition] = useState({ top: '50%', left: '50%' });

const handleShowInfo = (event) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Approximate InfoBubble dimensions
  const bubbleWidth = 500;
  const bubbleHeight = 400;
  
  // Center horizontally, position vertically near click
  let top = event.clientY;
  let left = (viewportWidth - bubbleWidth) / 2;
  
  // Clamp to viewport bounds
  if (top + bubbleHeight > viewportHeight) {
    top = viewportHeight - bubbleHeight - 20;
  }
  if (top < 20) top = 20;
  if (left < 20) left = 20;
  if (left + bubbleWidth > viewportWidth) {
    left = viewportWidth - bubbleWidth - 20;
  }
  
  setBubblePosition({ top: `${top}px`, left: `${left}px` });
  setShowInfoBubble(true);
};

// In JSX
<button onClick={(e) => handleShowInfo(e)}>Show Info</button>
{showInfoBubble && (
  <InfoBubble
    nodeData={data}
    onClose={() => setShowInfoBubble(false)}
    style={{
      top: bubblePosition.top,
      left: bubblePosition.left,
      position: 'fixed',
      zIndex: 9999
    }}
  />
)}
```

**Features**:
- ✅ Follows click Y-coordinate
- ✅ Centers horizontally for readability
- ✅ Automatically clamps to viewport bounds
- ✅ Works for any button or clickable element
- ✅ Example: MainMenu.js "View Analysis" button

### 2. **UseInfoBubbles Hook** (Recommended for interactive grids/tables)

**Use Case**: When InfoBubble should appear near where user clicked
**Implementation**: Use `useInfoBubbles` hook

```javascript
import useInfoBubbles from '../utils/useInfoBubbles';

const MyComponent = () => {
  const { containerRef, bubbles, handleClick, closeBubble } = useInfoBubbles();

  const handleNodeClick = (nodeData, event) => {
    handleClick(nodeData, event); // Automatically positions at click coordinates
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', overflow: 'auto' }}>
      <button onClick={(e) => handleNodeClick(data, e)}>Show Info</button>
      
      {bubbles.map(bubble => (
        <InfoBubble
          key={bubble.id}
          nodeData={bubble.definition}
          onClose={() => closeBubble(bubble.id)}
          style={{ 
            top: `${bubble.position.y}px`, 
            left: `${bubble.position.x}px`,
            position: 'absolute'
          }}
        />
      ))}
    </div>
  );
};
```

**Features**:
- ✅ Follows click coordinates
- ✅ Automatically clamps to container bounds
- ✅ Handles scrolling with `pageX/pageY`
- ✅ Supports multiple simultaneous bubbles
- ✅ Container-relative positioning

### 3. **Center-Screen Positioning** (Recommended for non-interactive elements)

**Use Case**: When InfoBubble should appear in center of screen (like MainMenu)
**Implementation**: Fixed positioning with transform centering

```javascript
import InfoBubble from '../layout/InfoBubble';

const MyComponent = () => {
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [infoBubbleData, setInfoBubbleData] = useState({});

  const handleShowInfo = () => {
    setInfoBubbleData(data);
    setShowInfoBubble(true);
  };

  return (
    <>
      <button onClick={handleShowInfo}>Show Analysis</button>
      
      {showInfoBubble && (
        <InfoBubble
          nodeData={infoBubbleData}
          onClose={() => setShowInfoBubble(false)}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed',
            zIndex: 9999
          }}
        />
      )}
    </>
  );
};
```

**Features**:
- ✅ Always appears in viewport center
- ✅ Works regardless of scroll position
- ✅ Simple implementation
- ✅ Good for modal-like usage

### 4. **Graph/Context Menu Positioning** (For GraphDataContext)

**Use Case**: When InfoBubble follows right-click context menus on graph nodes
**Implementation**: Event coordinate extraction with viewport clamping

```javascript
// In GraphDataContext.js or similar
const handleMoreInfo = async (node, event) => {
  try {
    // Fetch data for InfoBubble
    const nodeInfoData = await fetchNodeData(node);
    
    // Calculate position from event
    const bubblePosition = {
      top: `${event.clientY}px`,
      left: `${event.clientX}px`,
      position: 'fixed',
      zIndex: 1000
    };
    
    setInfoBubbleData(nodeInfoData);
    setInfoBubblePosition(bubblePosition);
    setShowInfoBubble(true);
  } catch (error) {
    console.error('Error loading info:', error);
  }
};

// In render
{showInfoBubble && (
  <InfoBubble
    nodeData={infoBubbleData}
    onClose={() => setShowInfoBubble(false)}
    style={infoBubblePosition}
  />
)}
```

**Features**:
- ✅ Appears at exact click location
- ✅ Fixed positioning relative to viewport
- ✅ Integrates with context menu systems

## InfoBubble Component Architecture

### Expected Props
```javascript
<InfoBubble
  nodeData={object}    // Required: Data to display
  onClose={function}   // Required: Close handler
  style={object}       // Optional but recommended: Positioning
/>
```

### Internal Positioning Logic
InfoBubble has smart positioning built-in:

1. **If `style` prop provided**: Uses those coordinates as base
2. **Auto-centering**: X-coordinate is centered in viewport
3. **Y-offset**: Y-coordinate is offset by bubble height for better visibility
4. **Fallback**: Without style prop, appears at (0,0) which is bottom-left

### Key CSS Classes
```css
.info-bubble {
  position: fixed;        /* Or absolute based on style prop */
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-width: 500px;
  max-height: 400px;
  z-index: 1000;
}
```

## Production Examples

### Working Examples

1. **MainMenu.js** - Center-screen positioning ✅
2. **useInfoBubbles.js** - Click-based positioning ✅
3. **GraphDataContext.js** - Context menu positioning ✅

### Common Mistakes

❌ **No positioning provided**
```javascript
<InfoBubble nodeData={data} onClose={close} />
// Results in bottom-left appearance
```

❌ **Relative positioning in wrong context**
```javascript
<InfoBubble 
  style={{ position: 'relative', top: '10px' }}
  // Won't work as expected in modal context
/>
```

❌ **Missing z-index**
```javascript
<InfoBubble 
  style={{ top: '100px', left: '100px' }}
  // May appear behind other elements
/>
```

## Troubleshooting Guide

### Issue: InfoBubble appears in bottom-left corner
**Solution**: Add proper `style` prop with positioning

### Issue: InfoBubble appears behind other elements
**Solution**: Add `zIndex: 9999` to style prop

### Issue: InfoBubble doesn't follow clicks
**Solution**: Use `useInfoBubbles` hook or extract event coordinates manually

### Issue: InfoBubble appears outside viewport
**Solution**: Implement bounds checking or use `useInfoBubbles` which handles this automatically

## Known Issues & Fixes

### Mobile Table Mode - InfoBubble Jumps Off-Screen
**Issue**: When clicking on words in table mode on mobile, InfoBubble sometimes appears off-screen or jumps around when scrolling.

**Root Cause**: The auto-centering logic in InfoBubble.js (useEffect lines 375-412) uses `pageY` coordinates without accounting for scroll position. On mobile, this causes the bubble to position relative to the full page height rather than the viewport.

**Solution**: The positioning calculation should use `clientY` (viewport-relative) for mobile views, or clamp the final position to viewport bounds with adequate margin.

**Implementation Note**: The fix involves adding bounds checking in the `useEffect` that calculates `centeredTop` to ensure it stays within viewport bounds on mobile devices.

## Future Improvements

### Potential Enhancements
- **Smart positioning**: Automatically avoid viewport edges
- **Animation**: Smooth entrance/exit animations
- **Mobile optimization**: Touch-friendly positioning with bounds clamping (PRIORITY)
- **Multiple positioning modes**: Prop to choose positioning strategy

### Standardization Opportunities
- **Unified hook**: Single hook for all positioning needs
- **Default centering**: Make center-screen positioning the default
- **Position props**: Standardized props for common positions
- **Mobile-specific positioning**: Separate logic path for mobile table views

---

## Best Practices

1. **Always provide positioning** via style prop
2. **Use appropriate pattern** based on interaction type
3. **Include z-index** for proper layering
4. **Test on mobile** for touch interactions
5. **Consider container bounds** for scrollable areas

## Quick Reference

| Use Case | Pattern | Implementation |
|----------|---------|----------------|
| UI Buttons | Smart click-based | Calculate from `event.clientY` with horizontal centering & bounds checking |
| Interactive grids/tables | useInfoBubbles hook | `useInfoBubbles` hook with container-relative positioning |
| Modal-like displays | Center-screen | `style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' }}` |
| Context menus | Event coordinates | `style={{ top: event.clientY, left: event.clientX, position: 'fixed' }}` |

---

**Last Updated**: September 16, 2025  
**Related Components**: InfoBubble.js, useInfoBubbles.js, MainMenu.js  
**See Also**: [UI Component Documentation](../ui-components/), [Context Menu System](CONTEXT-MENU-DOCUMENTATION.md)