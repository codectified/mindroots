# MindRoots Component Patterns & Examples

**Purpose**: Reference guide for common component patterns, layouts, and code examples used throughout the application.

---

## Table of Contents

1. [List Components](#list-components)
2. [Header Patterns](#header-patterns)
3. [Selector Components](#selector-components)
4. [Layout Containers](#layout-containers)
5. [Modal & Popover Patterns](#modal--popover-patterns)
6. [Form Components](#form-components)
7. [Graph Components](#graph-components)

---

## List Components

### Pattern: Corpus Item List (Corpus 1 - 99 Names)

**Files**:
- Component: `src/components/utils/CorpusRenderer.js`
- Styles: `src/styles/lists.css`
- Data: Fetched via `apiService.fetchCorpusItems()`

**Purpose**: Display frequency data alongside text content in a table-like list.

**Structure**:
```jsx
// HEADER
<div className="corpus-list-header" style={{
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '12px 24px'
}}>
  {L2 !== 'off' && <div style={{ flex: 1 }} />}
  <div style={{ width: '110px', textAlign: 'center' }}>
    <div className="freq-label">Quranic Root<br />Frequency</div>
  </div>
  <div style={{ width: '110px', textAlign: 'center' }}>
    <div className="freq-label">Quranic Word<br />Frequency</div>
  </div>
  <div style={{ flex: '0 0 150px' }} />
</div>

// DATA ROWS
{items.map((item, index) => (
  <div key={item.item_id} className="corpus-item-card">
    <div className="item-content">
      {/* Left: English/Transliteration (if L2 !== 'off') */}
      {L2 !== 'off' && (
        <div className="item-left">
          <div className="item-english">{item[L2] || '—'}</div>
          {item.transliteration && (
            <div className="item-transliteration">{item.transliteration}</div>
          )}
        </div>
      )}

      {/* Center-Left: Root Frequency */}
      <div className="item-frequency">
        <div className="freq-count">{item.qrootfreq || '—'}</div>
      </div>

      {/* Center-Right: Word Frequency */}
      <div className="item-frequency">
        <div className="freq-count">{item.quran_frequency || '—'}</div>
      </div>

      {/* Right: Arabic */}
      <div className="item-right">
        <div className="item-arabic" style={{ fontSize: `${fontSize}px` }}>
          {item[L1] || item.arabic || '—'}
        </div>
      </div>
    </div>
    {index < items.length - 1 && <div className="item-separator" />}
  </div>
))}
```

**CSS**:
```css
.corpus-list-header {
  display: flex;
  justifyContent: space-between;
  gap: 12px;
  padding: 12px 24px;
  border-bottom: 2px solid #2c3e50;
}

.item-frequency {
  width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.freq-count {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
}
```

**Key Features**:
- Always renders all columns (no conditional rendering)
- Responsive: Column widths adjust in @media queries
- Hover state: Highlight entire row
- Separator: Visual divider between items

**Common Issues & Fixes**:

| Issue | Cause | Fix |
|-------|-------|-----|
| Columns misaligned | Different `justifyContent` | Use `space-between` in both header and items |
| Header label cut off | Width too small (80px vs 110px) | Ensure header width = item width |
| Columns shift on scroll | Conditional rendering | Always render columns, use '—' for empty |
| Font size not scaling | Hardcoded pixel sizes | Use `calc(Xpx * var(--font-scale-*))` |

---

## Header Patterns

### Pattern 1: Simple Title Header

```jsx
<div className="section-header">
  <h1 className="section-title">Corpus Library</h1>
</div>
```

**CSS**:
```css
.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-title {
  font-size: 2.5rem;
  color: #333;
  font-weight: 600;
  margin: 0;
}
```

### Pattern 2: Header with Underline

```jsx
<div className="section-header">
  <h2 className="section-title">Featured Poetry</h2>
</div>
```

**CSS**:
```css
.section-title::after {
  content: '';
  display: block;
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, #dc3545, #fd7e14);
  margin: 15px auto 0;
  border-radius: 2px;
}
```

### Pattern 3: Two-Column Header

```jsx
<div style={{ display: 'flex', gap: '30px', marginBottom: '50px' }}>
  <div style={{ flex: 1, textAlign: 'center' }}>
    <h2 className="corpus-title">Quran Corpus</h2>
    <p className="corpus-subtitle">All words from the Quranic text</p>
  </div>
  <div style={{ flex: 1, textAlign: 'center' }}>
    <h2 className="corpus-title">Classical Poetry</h2>
    <p className="corpus-subtitle">Pre-Islamic and Islamic poetry</p>
  </div>
</div>
```

---

## Selector Components

### Pattern: Font Scale Selector

**Location**: `src/components/selectors/DualFontScaleSelector.js`

**Purpose**: Allow users to scale Latin and Semitic fonts independently.

```jsx
import React, { useState, useEffect } from 'react';

export const DualFontScaleSelector = () => {
  const [latinScale, setLatinScale] = useState(1);
  const [semiticScale, setSemiticScale] = useState(1);

  // Apply to document root
  const applyFontScale = (latin, semitic) => {
    document.documentElement.style.setProperty('--font-scale-latin', latin);
    document.documentElement.style.setProperty('--font-scale-semitic', semitic);
    localStorage.setItem('fontScaleLatin', latin);
    localStorage.setItem('fontScaleSemitic', semitic);
  };

  // Restore from localStorage on mount
  useEffect(() => {
    const savedLatin = localStorage.getItem('fontScaleLatin') || 1;
    const savedSemitic = localStorage.getItem('fontScaleSemitic') || 1;
    setLatinScale(parseFloat(savedLatin));
    setSemiticScale(parseFloat(savedSemitic));
    applyFontScale(savedLatin, savedSemitic);
  }, []);

  const handleLatinChange = (e) => {
    const value = parseFloat(e.target.value);
    setLatinScale(value);
    applyFontScale(value, semiticScale);
  };

  const handleSemiticChange = (e) => {
    const value = parseFloat(e.target.value);
    setSemiticScale(value);
    applyFontScale(latinScale, value);
  };

  return (
    <div className="selector-container">
      <label>Latin Font Scale: {latinScale.toFixed(1)}x</label>
      <input
        type="range"
        min="0.8"
        max="1.5"
        step="0.1"
        value={latinScale}
        onChange={handleLatinChange}
      />

      <label>Semitic Font Scale: {semiticScale.toFixed(1)}x</label>
      <input
        type="range"
        min="0.8"
        max="1.5"
        step="0.1"
        value={semiticScale}
        onChange={handleSemiticChange}
      />
    </div>
  );
};
```

**CSS Variables** (typography.css):
```css
:root {
  --font-scale-latin: 1;
  --font-scale-semitic: 1;
}

body {
  font-size: calc(16px * var(--font-scale-latin));
}

.arabic-text {
  font-size: calc(18px * var(--font-scale-semitic));
}
```

### Pattern: Filter Selector

**Location**: `src/components/selectors/FilterController.js`

```jsx
export const FilterController = () => {
  const { highlightVerb, setHighlightVerb, highlightNoun, setHighlightNoun } = useFilter();

  return (
    <div className="filter-group">
      <label>
        <input
          type="checkbox"
          checked={highlightVerb}
          onChange={(e) => setHighlightVerb(e.target.checked)}
        />
        Highlight Verbs
      </label>
      <label>
        <input
          type="checkbox"
          checked={highlightNoun}
          onChange={(e) => setHighlightNoun(e.target.checked)}
        />
        Highlight Nouns
      </label>
    </div>
  );
};
```

---

## Layout Containers

### Pattern: Info Bubble (Floating Container)

**Location**: `src/components/layout/InfoBubble.js`

```jsx
export const InfoBubble = ({ title, content, x, y, onClose }) => {
  return (
    <div
      className="info-bubble"
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000
      }}
    >
      <button className="close-button" onClick={onClose}>×</button>
      <div className="info-bubble-content">
        <h3>{title}</h3>
        <p>{content}</p>
      </div>
    </div>
  );
};
```

**CSS** (info-bubble.css):
```css
.info-bubble {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 15px;
  width: 300px;
  max-width: 90vw;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-family: 'Noto Serif', serif;
}

.info-bubble-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.close-button {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
}

.close-button:hover {
  color: #e74c3c;
  background-color: #f8f9fa;
}
```

### Pattern: Card Layout

```jsx
<div className="card-container">
  <div className="card">
    <div className="card-header">
      <h3>{title}</h3>
    </div>
    <div className="card-body">
      {content}
    </div>
    <div className="card-footer">
      {footer}
    </div>
  </div>
</div>
```

**CSS**:
```css
.card {
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-body {
  padding: 10px 0;
}
```

---

## Modal & Popover Patterns

### Pattern: Context Menu

**Location**: `src/components/graph/NodeContextMenu.js`

```jsx
export const NodeContextMenu = ({ position, options, onClose }) => {
  return (
    <div
      className="node-context-menu"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <button className="context-menu-close-button" onClick={onClose}>×</button>
      <div className="node-context-menu-content">
        {options.map((option, i) => (
          <button
            key={i}
            className="context-menu-option"
            onClick={() => {
              option.action();
              onClose();
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

**CSS** (node-context-menu.css):
```css
.node-context-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  width: 200px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.context-menu-option {
  width: 100%;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.context-menu-option:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}
```

---

## Form Components

### Pattern: Text Input with Label

```jsx
<div className="form-group">
  <label htmlFor="input-id" className="form-label">Label Text</label>
  <input
    id="input-id"
    type="text"
    className="form-input"
    placeholder="Enter text..."
    value={value}
    onChange={(e) => setValue(e.target.value)}
  />
</div>
```

**CSS**:
```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #4b0082;
  box-shadow: 0 0 0 3px rgba(75, 0, 130, 0.1);
}
```

### Pattern: Select Dropdown

```jsx
<div className="form-group">
  <label htmlFor="select-id">Choose Option:</label>
  <select
    id="select-id"
    className="form-select"
    value={selected}
    onChange={(e) => setSelected(e.target.value)}
  >
    <option value="">-- Select --</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
</div>
```

**CSS**:
```css
.form-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #4b0082;
  box-shadow: 0 0 0 3px rgba(75, 0, 130, 0.1);
}
```

---

## Graph Components

### Pattern: Force Simulation Visualization

**Location**: `src/components/graph/GraphVisualization.js`

```jsx
import * as d3 from 'd3';

export const GraphVisualization = ({ nodes, links, onNodeClick }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create SVG
    const svg = d3.select(svgRef.current);

    // Draw links
    const link = svg.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999');

    // Draw nodes
    const node = svg.selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 5)
      .attr('fill', d => d.color)
      .on('click', onNodeClick)
      .call(drag(simulation));

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    return () => simulation.stop();
  }, [nodes, links]);

  return <svg ref={svgRef} width={width} height={height} />;
};
```

---

## State Management Patterns

### Using Context with Custom Hook

```jsx
// Create context
const MyContext = React.createContext();

// Provider component
export const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialValue);
  const value = { state, setState };
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};

// Custom hook for easy access
export const useMy = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMy must be used inside MyProvider');
  }
  return context;
};

// Usage in component
const MyComponent = () => {
  const { state, setState } = useMy();
  return <div>{state}</div>;
};
```

---

## Debugging Components

### Adding Debug Logging

```jsx
useEffect(() => {
  console.log('Component mounted:', { props, state });
  return () => console.log('Component unmounted');
}, []);

useEffect(() => {
  console.log('Value changed:', value);
}, [value]);
```

### React DevTools Profiler

In development, use React DevTools Profiler to:
1. Identify slow components
2. See which props changed
3. Track render cycles

```jsx
// Profile specific component
import { Profiler } from 'react';

const onRenderCallback = (
  id, phase, actualDuration, baseDuration, startTime, commitTime
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

---

**Last Updated**: November 26, 2025
**Related Documentation**: See FRONTEND-DESIGN-GUIDE.md for design principles and patterns
