# Frontend Integration Checklist - Backend Deduplication Fixes

**Testing Date**: August 21, 2025  
**Backend Status**: ✅ TESTED AND VERIFIED  
**Ready For**: Frontend Integration Testing

## Pre-Integration Setup

### Required Configuration Change
**CRITICAL**: Update `src/services/apiService.js` to use localhost for testing:

```javascript
// Comment out production config
// const api = axios.create({
//   baseURL: 'https://theoption.life/api',
//   headers: {
//     'Authorization': 'Bearer 0e8f5f7ec6a5589b4f2d89aba194d23bcd302578b81f73fba35970a8fe392ba1',
//   },
// });

// Enable localhost config  
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Authorization': 'Bearer localhost-dev-key-123',
  },
});
```

### Environment Verification
- [ ] Backend server running on localhost:5001
- [ ] Frontend React app running (usually port 3000)
- [ ] API service pointing to localhost
- [ ] Browser developer console open for monitoring

## Critical Test Cases

### 1. Duplicate Node Resolution ✅ (Backend Verified)
**Test**: Load any corpus item and expand to words
- [ ] **Graph View**: No duplicate nodes appear
- [ ] **Table View**: No duplicate entries  
- [ ] **Console**: No duplicate ID warnings
- [ ] **Visual**: Clean graph layout without overlapping nodes

### 2. Single-Click Info Bubble ✅ (Root Cause Fixed)
**Test**: Click word nodes in guided mode
- [ ] **First Click**: Info bubble appears immediately 
- [ ] **No Double-Click**: Single click is sufficient
- [ ] **Consistency**: Works across all node types (word, root, form, corpus)
- [ ] **Position**: Info bubble appears at correct cursor position

### 3. Graph Expansion Behavior
**Test**: Expand nodes in various contexts

#### Root Node Expansion
- [ ] Click root node → shows words (no duplicates)
- [ ] Word nodes have consistent IDs
- [ ] Links connect properly without cartesian product

#### Form Node Expansion  
- [ ] Click form node → shows words (no duplicates)
- [ ] Form-word relationships are 1:1
- [ ] No N×M link proliferation

#### Corpus Item Context
- [ ] Load corpus screen
- [ ] Select corpus item → expand to words
- [ ] Word expansion shows proper root/form connections
- [ ] All nodes unique and properly connected

### 4. Advanced Mode Testing
**Test**: Context menu and advanced features
- [ ] Right-click nodes → context menu appears
- [ ] "Inspect Node" shows clean data
- [ ] Node actions work without conflicts  
- [ ] No ID-related errors in console

### 5. Filter Testing
**Test**: Node filtering with clean data
- [ ] Language filters work correctly
- [ ] Form classification filters work
- [ ] Semitic language filters work
- [ ] No filter conflicts due to duplicate nodes

### 6. Performance Validation
**Monitor**: Browser performance with clean data
- [ ] Graph rendering speed improved
- [ ] Memory usage reduced (no duplicate data)
- [ ] Smooth interactions without lag
- [ ] No excessive API calls

## Error Monitoring

### Console Warnings to Watch For
- [ ] No "duplicate node ID" warnings
- [ ] No "node not found" errors  
- [ ] No React key warnings for duplicate elements
- [ ] No D3.js selection conflicts

### Network Tab Verification
- [ ] API responses show proper node counts
- [ ] No redundant data in payloads
- [ ] Response times within normal range
- [ ] Proper HTTP status codes (200)

## Regression Testing

### Existing Features Still Working
- [ ] Search functionality (root search modes)
- [ ] Library navigation
- [ ] Corpus selection  
- [ ] Language switching (L1/L2)
- [ ] Graph/Table view switching
- [ ] Mini menu controls

### Visual Layout Verification  
- [ ] Graph layout looks normal (no overlapping)
- [ ] Node colors consistent
- [ ] Link connections proper
- [ ] No visual artifacts from deduplication

## Expected Behavior Changes

### ✅ Positive Changes (Should Happen)
1. **Single-Click Info Bubbles**: No more double-click requirement
2. **Cleaner Graphs**: No duplicate nodes cluttering visualization  
3. **Better Performance**: Faster rendering with deduplicated data
4. **Consistent IDs**: No frontend ID conflicts

### ⚠️ Watch For (Potential Issues)
1. **Cache Clearing**: May need to clear browser cache after backend changes
2. **Layout Differences**: Graph layouts may look different without duplicate nodes
3. **Link Positioning**: D3.js force simulation may behave differently with cleaner data

## Troubleshooting Guide

### If Info Bubbles Still Require Double-Click
1. Check browser cache - clear and refresh
2. Verify API service pointing to localhost
3. Check console for duplicate node warnings
4. Test with hard refresh (Cmd+Shift+R)

### If Duplicate Nodes Still Appear  
1. **Check Backend**: Ensure localhost server has latest code
2. **Check Frontend**: Verify no frontend-side duplication logic
3. **Check API URL**: Confirm pointing to localhost:5001
4. **Check Authorization**: Verify using localhost dev token

### If Performance Issues Occur
1. **Monitor Network**: Check API response sizes
2. **Check Console**: Look for memory leak warnings
3. **Profile React**: Use React DevTools for performance analysis

## Success Criteria

### ✅ Ready for Production When:
- [ ] All 6 test cases pass
- [ ] No duplicate nodes in any scenario
- [ ] Single-click info bubbles work consistently
- [ ] No performance regressions
- [ ] No console errors related to node IDs
- [ ] User workflow feels smooth and responsive

### 📋 Documentation Updates Needed:
- [ ] Update CLAUDE.md with backend fix notes
- [ ] Record any new behavior patterns
- [ ] Note any performance improvements observed
- [ ] Update troubleshooting guides if needed

---

**Testing Priority**: Focus on corpus item expansion and info bubble behavior - these were the primary user-reported issues that led to this backend overhaul.