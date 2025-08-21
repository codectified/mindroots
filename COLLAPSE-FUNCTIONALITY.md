# Node Collapse/Expand Functionality

**Date Added**: August 21, 2025  
**Feature**: Second click on expanded root/form nodes collapses them  
**Applies To**: Both graph and table modes

## Implementation Details

### Root Node Collapse Logic
**File**: `src/contexts/GraphDataContext.js` (lines 146-179)

**Behavior**:
1. **First click on root**: Expands to show connected words
2. **Second click on same root**: Collapses by removing connected words

**Detection Logic**:
- Checks for existing `HAS_WORD` links where root is the source
- If connected words found → collapse
- If no connected words → expand

### Form Node Collapse Logic  
**File**: `src/contexts/GraphDataContext.js` (lines 253-286)

**Behavior**:
1. **First click on form**: Expands to show words that use this form
2. **Second click on same form**: Collapses by removing connected words

**Detection Logic**:
- Checks for existing `HAS_FORM` links where form is the target
- If connected words found → collapse  
- If no connected words → expand

### Collapse Implementation
**What Gets Removed**:
- All word nodes connected to the clicked root/form
- All links connecting to those word nodes
- Maintains other nodes and relationships

**Smart Filtering**:
```javascript
// Remove connected word nodes
nodes: prev.nodes.filter(n => !connectedWordIds.has(n?.id))

// Remove links that connect to removed words
links: prev.links.filter(link => {
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
  return !connectedWordIds.has(sourceId) && !connectedWordIds.has(targetId);
})
```

## User Experience

### Graph Mode
- **Click root/form once**: Shows connected words with links
- **Click same root/form again**: Words disappear, keeping graph clean
- **Visual**: Graph becomes less cluttered when collapsing

### Table Mode  
- **Click root/form once**: Words appear indented under the parent
- **Click same root/form again**: Words disappear from table
- **Visual**: Hierarchical table structure maintained

## Testing Steps

### Basic Functionality
1. Load any root search results
2. Click a root → should show connected words
3. Click same root again → words should disappear
4. Repeat with form nodes

### Edge Cases
1. **Multiple roots expanded**: Collapsing one shouldn't affect others
2. **Shared words**: If word connects to multiple roots, only remove when appropriate
3. **Mixed expansions**: Root and form expansions should work independently

## Console Output
When testing, you'll see debug logs:
```
Root root_2765 expansion status: expanded, connected words: 5
Collapsing root - removing connected words
```

Or:
```
Root root_2765 expansion status: collapsed, connected words: 0  
Expanding root - fetching words
```

## Benefits

### UX Improvements
- **Cleaner interface**: Users can hide information they don't need
- **Better navigation**: Easier to focus on specific parts of the graph
- **Intuitive behavior**: Second click = collapse is standard UI pattern

### Performance Benefits
- **Reduced DOM nodes**: Fewer elements when collapsed
- **Faster rendering**: Less complex graph layouts
- **Memory efficiency**: Smaller data structures when collapsed

## Future Enhancements

### Visual Indicators
- Could add expand/collapse icons next to expandable nodes
- Different styling for expanded vs collapsed states
- Hover states to indicate clickable/collapsible nodes

### Keyboard Support
- Space bar to expand/collapse focused node
- Arrow keys to navigate between expandable nodes

---

**Status**: ✅ Implemented and ready for testing  
**Compatibility**: Works with both existing graph and table modes  
**Breaking Changes**: None - purely additive functionality