# MindRoots Frontend Design Guide

**Last Updated**: November 26, 2025
**Purpose**: Comprehensive reference for frontend architecture, design patterns, and common pitfalls to prevent layout and styling issues.

---

## Table of Contents

1. [Core Design Principles](#core-design-principles)
2. [Layout Patterns](#layout-patterns)
3. [Component Architecture](#component-architecture)
4. [Styling Guidelines](#styling-guidelines)
5. [Flexbox Alignment Patterns](#flexbox-alignment-patterns)
6. [List/Table Rendering](#listtable-rendering)
7. [Responsive Design](#responsive-design)
8. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
9. [State Management](#state-management)
10. [Typography System](#typography-system)

---

## Core Design Principles

### 1. **Consistent Spacing Model**
- **Gap standard**: 12px between flexbox items
- **Padding standard**: 12px-24px for containers
- **Margin**: Use sparingly; prefer padding and gaps

**Why**: Consistent spacing makes layouts predictable and easy to align nested components.

### 2. **Flex-based Layout System**
- **Primary layout method**: CSS Flexbox (not Grid for most components)
- **Direction**: Row-oriented for horizontal layouts, column for vertical stacks
- **Alignment**: Use `justify-content` and `align-items` consistently

### 3. **Mobile-First Responsive Design**
- **Breakpoints**: 480px, 768px, 1024px (see media-queries.css)
- **Strategy**: Base styles for mobile, then @media queries for larger screens
- **Touch targets**: Minimum 40px height for buttons/interactive elements

### 4. **Semantic HTML + CSS Classes**
- Component-scoped classes prevent conflicts
- BEM-like naming: `.component-section-element`
- Example: `.corpus-item-card`, `.item-frequency`, `.freq-label`

---

## Layout Patterns

### Pattern 1: Header + Data Grid Alignment

**Problem**: Headers and data rows misaligned due to flexbox differences.

**Solution**: Ensure identical structure between header and data rows.

```jsx
// HEADER STRUCTURE
<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px 24px' }}>
  {showLeftContent && <div style={{ flex: 1 }} />}
  <div style={{ width: '110px', flexShrink: 0 }}>Column 1</div>
  <div style={{ width: '110px', flexShrink: 0 }}>Column 2</div>
  <div style={{ flex: '0 0 150px' }} />
</div>

// DATA ROW STRUCTURE (MUST MATCH EXACTLY)
<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
  {showLeftContent && <div style={{ flex: 1 }} />}
  <div style={{ width: '110px', flexShrink: 0 }}>Data 1</div>
  <div style={{ width: '110px', flexShrink: 0 }}>Data 2</div>
  <div style={{ flex: '0 0 150px' }} />
</div>
```

**Key Rules**:
1. Both must use **identical `justifyContent`, `gap`, `padding`**
2. All column widths must match exactly (110px = 110px)
3. Both flex spacers must use same values (flex: 1 = flex: 1)
4. Right spacer must be identical (flex: 0 0 150px)
5. **Never conditionally render columns** - always render, use placeholder content (e.g., '—')

### Pattern 2: Nested Flex Containers

When nesting flex containers (common in cards and lists):

```jsx
// OUTER CONTAINER
<div style={{ display: 'flex', gap: '12px', padding: '12px 24px' }}>
  // LEFT SECTION (flex: 1 = takes remaining space)
  <div style={{ flex: 1 }}>
    Content here expands to fill available space
  </div>

  // FIXED WIDTH SECTIONS
  <div style={{ width: '80px', flexShrink: 0 }}>
    Fixed width, won't shrink
  </div>
  <div style={{ width: '80px', flexShrink: 0 }}>
    Fixed width, won't shrink
  </div>

  // RIGHT SECTION
  <div style={{ flex: '0 0 150px' }}>
    Fixed at 150px, no grow/shrink
  </div>
</div>
```

**Critical Properties**:
- `flex: 1` = grows/shrinks with content
- `flex: 0 0 Xpx` = fixed size, no flex behavior
- `flexShrink: 0` = prevents shrinking below content width
- `width: Xpx` + `flexShrink: 0` = fixed column width

### Pattern 3: Vertical Flex Stacks

For vertical alignment (common in info bubbles, cards):

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  <div>Header/Title</div>
  <div>Content line 1</div>
  <div>Content line 2</div>
</div>
```

---

## Component Architecture

### Hierarchy Overview

```
App.js (14 Context Providers)
  └─ Router
      ├─ Main Feature Components
      │   ├─ CorpusGraphScreen (graph visualization)
      │   ├─ Library (corpus selection)
      │   └─ PrimaryList (corpus items)
      │
      ├─ Selector Components (16 total)
      │   ├─ DualFontScaleSelector (font sizing)
      │   ├─ LanguageSelector
      │   ├─ FilterController
      │   └─ ... more selectors
      │
      ├─ Static Pages
      │   ├─ Settings
      │   ├─ About
      │   └─ ProfilePage
      │
      └─ Layout Components
          ├─ Layout (page wrapper)
          ├─ BottomNav (persistent navigation)
          └─ InfoBubble (floating tooltips)
```

### Component Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `*Screen` | `CorpusGraphScreen` | Full-page view components |
| `*Container` | `corpus-list-container` | Layout wrapper divs |
| `*Card` | `corpus-item-card` | Clickable item containers |
| `*Header` | `corpus-list-header` | Section headers/titles |
| `*Selector` | `FontScaleSelector` | User input controls |
| `*Context` | `LanguageContext` | Global state providers |
| `use*` | `useHighlight()` | Custom hooks for context |

---

## Styling Guidelines

### 1. CSS Variables for Theming

Located in `base.css`:

```css
:root {
  --primary-color: #2c3e50;
  --accent-color: #4b0082;
  --bg-light: #f8f9fa;
  --bg-dark: #2c3e50;
  --border-color: #ccc;
  --shadow-light: 0 2px 10px rgba(0, 0, 0, 0.1);
  --shadow-medium: 0 4px 15px rgba(0, 0, 0, 0.1);
  --shadow-dark: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

**Usage**: `color: var(--primary-color)` instead of hardcoded hex values.

### 2. Font System (Typography)

Controlled via CSS variables in `typography.css`:

```css
:root {
  --font-scale-latin: 1;      /* Multiplier for Latin fonts */
  --font-scale-semitic: 1;    /* Multiplier for Arabic fonts */
}

/* Usage in components */
font-size: calc(16px * var(--font-scale-latin));
font-size: calc(22px * var(--font-scale-semitic));
```

**Component**: `DualFontScaleSelector.js` modifies these variables via:
```javascript
document.documentElement.style.setProperty('--font-scale-latin', scaleValue);
document.documentElement.style.setProperty('--font-scale-semitic', scaleValue);
```

**Important**: All font sizes must use `calc()` with CSS variables. **Never hardcode `16px`**.

### 3. Color Scheme

**Primary Palette**:
- Dark text: `#2c3e50` (headers, primary text)
- Muted text: `#7f8c8d` (labels, secondary text)
- Light backgrounds: `#f8f9fa`, `#e9ecef`
- Accent: `#4b0082` (indigo for hover/select)
- Status: Green `#28a745`, Red `#dc3545`, Blue `#007bff`

### 4. Hover & Active States

```css
.button:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
  cursor: pointer;
}

.button:active {
  background-color: #dee2e6;
  transform: translateY(1px);
}

.button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(102, 102, 102, 0.2);
}
```

---

## Flexbox Alignment Patterns

### Common Layout Scenarios

#### Scenario 1: Left-Content | Center-Columns | Right-Content

```jsx
// Recommended: space-between layout
<div style={{
  display: 'flex',
  justifyContent: 'space-between',  // CRITICAL
  alignItems: 'center',
  gap: '12px',
  padding: '12px 24px'
}}>
  <div style={{ flex: 1 }}>Left (expandable)</div>
  <div style={{ width: '110px', flexShrink: 0 }}>Center 1</div>
  <div style={{ width: '110px', flexShrink: 0 }}>Center 2</div>
  <div style={{ flex: '0 0 150px' }}>Right (fixed)</div>
</div>
```

**Why `space-between`**: Distributes space evenly, making alignment predictable.

#### Scenario 2: Horizontal Alignment (No Space-Between)

```jsx
<div style={{
  display: 'flex',
  justifyContent: 'flex-start',  // Aligns to left
  gap: '12px'
}}>
  <button>Button 1</button>
  <button>Button 2</button>
  <button>Button 3</button>
</div>
```

#### Scenario 3: Centered Content

```jsx
<div style={{
  display: 'flex',
  justifyContent: 'center',    // Horizontal center
  alignItems: 'center',         // Vertical center
  width: '100%',
  height: '200px'
}}>
  Content is centered
</div>
```

### Alignment Property Reference

| Property | Value | Behavior |
|----------|-------|----------|
| `justifyContent` | `flex-start` | Items align to start |
| | `flex-end` | Items align to end |
| | `center` | Items centered |
| | `space-between` | **Items spread apart evenly** ← Use for headers |
| | `space-around` | Space around items |
| | `space-evenly` | Equal space everywhere |
| `alignItems` | `flex-start` | Align to top of container |
| | `center` | Vertical center |
| | `stretch` | Stretch to fill height |
| `flex` | `1` | **Flexible, grows/shrinks** ← Use for flex content |
| | `0 0 100px` | **Fixed size** ← Use for fixed columns |

---

## List/Table Rendering

### Best Practice: Corpus List Pattern

**Location**: `src/components/utils/CorpusRenderer.js` and `src/styles/lists.css`

**Structure**:
```jsx
<div className="corpus-list-container">
  {/* HEADER */}
  <div className="corpus-list-header">
    {/* Must match item structure exactly */}
  </div>

  {/* DATA ROWS */}
  {items.map((item, index) => (
    <div key={item.item_id} className="corpus-item-card">
      <div className="item-content">
        {/* Must use same flex properties as header */}
      </div>
      {index < items.length - 1 && <div className="item-separator" />}
    </div>
  ))}
</div>
```

### Key Rules for Lists

1. **Always render all columns** - Don't conditionally render columns
   ```jsx
   // ❌ WRONG - causes misalignment
   {item.frequency && <div className="freq-column">{item.frequency}</div>}

   // ✅ CORRECT - always rendered
   <div className="freq-column">{item.frequency || '—'}</div>
   ```

2. **Use `.item-separator`** to visually break rows
   ```jsx
   {index < items.length - 1 && <div className="item-separator" />}
   ```

3. **Apply hover effects to `.corpus-item-card`**, not individual cells
   ```css
   .corpus-item-card:hover {
     background: linear-gradient(...);
     border-left-color: #4b0082;
   }
   ```

4. **Use exact width matching** between header and data
   ```css
   .header-center { width: 110px; }
   .item-frequency { width: 110px; }  /* MUST MATCH */
   ```

### Example: Two-Column Frequency Display

**Problem Solved**: Word Frequency + Root Frequency alignment

**Solution**:
```jsx
// Header
<div style={{ width: '110px' }}>
  <div className="freq-label">Quranic Root<br />Frequency</div>
</div>
<div style={{ width: '110px' }}>
  <div className="freq-label">Quranic Word<br />Frequency</div>
</div>

// Data Row
<div style={{ width: '110px' }}>
  <div className="freq-count">{item.qrootfreq || '—'}</div>
</div>
<div style={{ width: '110px' }}>
  <div className="freq-count">{item.quran_frequency || '—'}</div>
</div>
```

**CSS** (lists.css):
```css
.header-center {
  width: 110px;
  text-align: center;
  flexShrink: 0;
}

.item-frequency {
  width: 110px;
  flexShrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
```

---

## Responsive Design

### Breakpoints (from media-queries.css)

```css
@media (max-width: 1024px) {
  /* Tablets/large phones - slight adjustments */
  .header-center { width: 100px; }
  .item-frequency { width: 100px; }
}

@media (max-width: 768px) {
  /* Medium devices - more significant changes */
  .corpus-list-header { /* flex adjustments */ }
  .item-left { flex: 1; min-width: 0; }
  .item-right { flex: 0 0 100px; }
}

@media (max-width: 480px) {
  /* Small phones - full redesign for portrait */
  .overlay { padding: 5px; }
  button { padding: 6px 12px; font-size: 12px; }
}
```

### Mobile Touch Targets

Ensure minimum touch target size of 40px x 40px:

```css
.button {
  padding: 8px 16px;        /* Desktop: ~32px height */
  font-size: 14px;
}

@media (max-width: 768px) {
  .button {
    padding: 10px 12px;     /* Mobile: ~40px height */
    font-size: 15px;
    min-height: 40px;
  }
}
```

### Font Scaling on Mobile

```css
@media (max-width: 768px) {
  body { font-size: 15px; }
  h1 { font-size: 24px; }
  h2 { font-size: 18px; }
}

@media (max-width: 480px) {
  body { font-size: 14px; }
  h1 { font-size: 20px; }
  h2 { font-size: 16px; }
}
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Misaligned Headers and Data Rows

**Symptom**: Headers don't line up with columns below.

**Root Causes**:
1. Different `gap` values between header and data
2. Different `justifyContent` values
3. Conditionally rendered columns
4. Width mismatch (header 110px, data 95px)

**Solution Checklist**:
- [ ] Header and data rows use identical `display: flex`
- [ ] Both use same `gap: 12px`
- [ ] Both use same `justifyContent` (usually `space-between`)
- [ ] All column widths match exactly
- [ ] No conditional column rendering
- [ ] `flex-shrink: 0` applied to fixed-width columns

**Prevention**: Create a reusable column component:
```jsx
const FixedColumn = ({ width = '110px', children }) => (
  <div style={{ width, flexShrink: 0, textAlign: 'center' }}>
    {children}
  </div>
);
```

### Pitfall 2: Content Overflowing Fixed-Width Containers

**Symptom**: Text gets cut off or overlaps in narrow columns.

**Solution**:
```css
.fixed-column {
  width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* For multiple lines */
.fixed-column {
  width: 110px;
  word-break: break-word;
  overflow: hidden;
}
```

### Pitfall 3: Flexbox Items Not Shrinking on Small Screens

**Symptom**: Layout breaks on mobile, items don't wrap/shrink.

**Solution**:
```css
.flex-item {
  flex: 1;
  min-width: 0;  /* ← CRITICAL for flex children */
}
```

**Why**: Flex children won't shrink below their content width without `min-width: 0`.

### Pitfall 4: Font Size Changes Not Applying Globally

**Symptom**: Font scale selector changes some elements but not others.

**Root Cause**: Hardcoded pixel sizes instead of CSS variables.

**Solution**: Replace all hardcoded sizes:
```css
/* ❌ WRONG */
.text { font-size: 16px; }

/* ✅ CORRECT */
.text { font-size: calc(16px * var(--font-scale-latin)); }
```

**Audit**: Search codebase for `font-size: ` followed by pixel values.

### Pitfall 5: Z-Index Conflicts

**Symptom**: Modals appear behind other content.

**Solution**: Define z-index scale in base.css:
```css
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 1000;
  --z-tooltip: 1100;
}

.modal { z-index: var(--z-modal); }
.tooltip { z-index: var(--z-tooltip); }
```

### Pitfall 6: CSS Specificity Wars

**Symptom**: Styles not applying despite being correct.

**Solution**: Follow specificity order:
```css
/* Level 1: Base styles */
button { padding: 8px; }

/* Level 2: Type modifiers */
button.primary { color: blue; }

/* Level 3: State modifiers */
button:hover { background: lightblue; }

/* Level 4: Context-specific (use sparingly) */
.settings button.primary:hover { ... }
```

**Rule**: Avoid `!important` - it breaks specificity cascade.

---

## State Management

### Context Organization

**Location**: `src/contexts/` (14 providers)

**Hierarchy** (from App.js):
```
AdvancedModeProvider (top-level, affects many components)
  ├─ DisplayModeProvider
  ├─ SettingsProvider
  ├─ TextLayoutProvider
  ├─ HighlightProvider
  ├─ LanguageProvider
  ├─ WordShadeProvider
  └─ FilterProvider
      └─ ... nested providers
          └─ GraphDataProvider (lowest level, most specific)
```

**Why nested**: Lower-level providers depend on upper-level state.

### Key Contexts & Usage

| Context | Purpose | Consumed By | Key Functions |
|---------|---------|-------------|---------------|
| `LanguageContext` | L1/L2 language selection | All display components | `useLanguage()` |
| `FilterContext` | Word type filtering | GraphVisualization, CorpusRenderer | `useFilter()` |
| `HighlightContext` | Highlight modes | NodeInspector, CorpusRenderer | `useHighlight()` |
| `AdvancedModeContext` | Guided vs Advanced UI | ModeSelector, NodeContextMenu | `useAdvancedMode()` |
| `CorpusContext` | Current corpus selection | Library, PrimaryList | `useCorpus()` |
| `GraphDataContext` | Graph data & navigation | CorpusGraphScreen, all graph components | `useGraphData()` |
| `TextLayoutContext` | Text direction/layout | CorpusRenderer, all text display | `useTextLayout()` |

### Custom Hook Pattern

All contexts expose custom hooks:
```javascript
// In LanguageContext.js
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be inside LanguageProvider');
  return context;
};

// Usage in components
const { L1, L2, setL2 } = useLanguage();
```

### Avoiding Context Prop Drilling

**Problem**: Passing props through many intermediate components.

**Solution**: Use Context to skip intermediate components:
```jsx
// ❌ WRONG - prop drilling
<ComponentA prop={value}>
  <ComponentB prop={value}>
    <ComponentC prop={value}>
      <ComponentD>{value}</ComponentD>
    </ComponentC>
  </ComponentB>
</ComponentA>

// ✅ CORRECT - Context
<ContextProvider value={value}>
  <ComponentA>
    <ComponentB>
      <ComponentC>
        <ComponentD>{useContext().value}</ComponentD>
      </ComponentC>
    </ComponentB>
  </ComponentA>
</ContextProvider>
```

---

## Typography System

### Font Families

**Defined** in `typography.css`:

```css
:root {
  --font-serif: 'Noto Serif', 'Georgia', serif;
  --font-arabic: 'Noto Sans Arabic', 'Amiri', serif;
  --font-monospace: 'Courier New', monospace;
}
```

**Usage**:
```css
.text-content { font-family: var(--font-serif); }
.arabic-text { font-family: var(--font-arabic); }
.code-text { font-family: var(--font-monospace); }
```

### Font Sizing with Scale Variables

All font sizes must support global scaling:

```css
/* Base size * scale variable */
.large-text { font-size: calc(24px * var(--font-scale-latin)); }
.body-text { font-size: calc(16px * var(--font-scale-latin)); }
.small-text { font-size: calc(12px * var(--font-scale-latin)); }

/* Arabic text uses different scale */
.arabic-large { font-size: calc(28px * var(--font-scale-semitic)); }
```

### Line Height & Readability

```css
.body-text { line-height: 1.5; }      /* Default - good readability */
.header-text { line-height: 1.2; }    /* Tighter for headers */
.dense-text { line-height: 1.3; }     /* Between normal and tight */
.spaced-text { line-height: 1.8; }    /* Extra spacing for accessibility */
```

### Text Transform & Case

```css
.uppercase { text-transform: uppercase; letter-spacing: 0.5px; }
.capitalize { text-transform: capitalize; }
.lowercase { text-transform: lowercase; }
```

---

## Performance Optimization

### 1. Prevent Unnecessary Re-renders

Use `React.memo()` for expensive components:
```jsx
const MemoizedComponent = React.memo(({ data }) => (
  <div>{data}</div>
));
```

### 2. Virtualize Long Lists

For lists with 100+ items, use react-window or similar.

### 3. Lazy Load Images

```jsx
<img loading="lazy" src={url} alt="description" />
```

### 4. CSS Containment

Limit recalculation scope:
```css
.component {
  contain: layout style;
  will-change: transform;
}
```

---

## Accessibility Guidelines

### 1. Color Contrast

- Text on background: minimum 4.5:1 contrast ratio
- Test with WebAIM contrast checker

### 2. Keyboard Navigation

- All interactive elements must be keyboard accessible
- Use `outline: 2px solid` for focus state, not `outline: none`

### 3. Alt Text & ARIA

```jsx
<button aria-label="Close menu">×</button>
<img alt="Descriptive text" src={url} />
```

### 4. Semantic HTML

```jsx
// ✅ CORRECT
<button onClick={handle}>Click me</button>
<nav><a href="/page">Link</a></nav>

// ❌ WRONG
<div onClick={handle}>Click me</div>
```

---

## Debugging Flexbox Issues

### Using Browser DevTools

1. **Inspect element** → Elements tab
2. **Look for flex container** → `display: flex` indicator
3. **Check Layout section** → Shows flex children with their flex values
4. **Hover over elements** → Highlights flex layout boundaries

### Common Debug Checks

```javascript
// Log all flex properties
const element = document.querySelector('.your-element');
const styles = window.getComputedStyle(element);
console.log({
  display: styles.display,
  justifyContent: styles.justifyContent,
  alignItems: styles.alignItems,
  gap: styles.gap,
  flex: styles.flex,
  flexShrink: styles.flexShrink,
  width: styles.width
});
```

---

## Version Control & Commits

When making styling changes:

```bash
# Structure commits by concern
git commit -m "fix: align frequency columns in corpus list

- Update header structure to match item-content layout
- Use space-between for header and item flex containers
- Ensure all column widths are 110px
- Always render both frequency columns

Fixes #123"
```

---

## Quick Reference Checklist

Use when building new list/table components:

- [ ] Create `.component-container` wrapper
- [ ] Create `.component-header` with matching `.component-item` structure
- [ ] Use `display: flex`, `gap: 12px`, `justifyContent: space-between`
- [ ] Set explicit widths on fixed columns + `flexShrink: 0`
- [ ] Add `.component-separator` between items
- [ ] Create responsive version in @media query
- [ ] Test alignment on desktop (1920px) and mobile (375px)
- [ ] Verify font scaling works with DualFontScaleSelector
- [ ] Check keyboard navigation and focus states
- [ ] Document CSS variables used

---

## Additional Resources

- **CSS Flexbox Guide**: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
- **React Context Guide**: https://react.dev/reference/react/useContext
- **WCAG Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/
- **BEM Naming Methodology**: http://getbem.com/

---

**Last Updated**: November 26, 2025
**Maintained By**: Claude Code
**Review Frequency**: As needed when new patterns emerge
