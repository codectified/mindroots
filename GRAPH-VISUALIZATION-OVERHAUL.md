# Graph Visualization Overhaul Documentation

**Project**: MindRoots Graph Visualization Enhancement  
**Date Started**: August 24, 2025  
**Status**: Stage 1 Complete ✅, Stage 2 In Progress  
**File**: `src/components/graph/GraphVisualization.js`

---

## 📋 **Executive Summary**

This document tracks the comprehensive overhaul of the MindRoots graph visualization component to address critical UX issues:
- **Primary Pain Point**: Unreadable/overlapping labels on tiny nodes
- **Secondary Issues**: Unpredictable layout, zoom jumping, performance problems
- **Approach**: Phased implementation with testing at each stage

---

## 🎯 **Implementation Stages**

### **Stage 0 — Quick Audit & Guardrails** ✅ COMPLETE
**Duration**: ½ day  
**Goal**: Stop regressions and make behavior measurable

#### **Implemented Features:**
```javascript
// 1. Layout mode flag
const [layoutMode, setLayoutMode] = useState('force'); // 'force' | 'computed'

// 2. Comprehensive metrics logging
const logGraphMetrics = useCallback((nodes) => {
  console.log('📊 Graph Metrics:', {
    totalNodes, wordNodes, labels, avgDataSize, minDataSize, maxDataSize, layoutMode
  });
}, [layoutMode]);

// 3. Zoom transform persistence
const lastTransform = useRef(null);
// Persists camera position across re-renders
```

#### **Acceptance Criteria Met:**
- ✅ Zoom never jumps during re-renders
- ✅ Camera position maintained across data updates
- ✅ Metrics logged to console with 📊 emoji
- ✅ Measurable behavior baseline established

---

### **Stage 1 — Label Readability & Overlap Control** ✅ COMPLETE
**Duration**: 1 day  
**Goal**: Address #1 pain point - unreadable/overlapping labels

#### **Implemented Features:**

##### **1. Label Anchors (14px offset from nodes)**
```javascript
const computeLabelAnchor = useCallback((node, width, height) => {
  const angle = Math.atan2(node.y - centerY, node.x - centerX);
  const labelOffset = 14;
  const totalOffset = nodeRadius + labelOffset;
  return {
    x: node.x + Math.cos(angle) * totalOffset,
    y: node.y + Math.sin(angle) * totalOffset
  };
}, []);
```
- **Purpose**: Positions labels away from nodes to prevent overlap
- **Implementation**: Calculates angle from graph center, offsets 14px from node edge
- **Result**: Labels float around nodes without covering them

##### **2. One-Shot Label Separation**
```javascript
const separateLabels = useCallback((labelAnchors, maxIterations = 15, maxNudge = 5) => {
  for (let iter = 0; iter < maxIterations; iter++) {
    // Detect overlaps, nudge apart by max 5px
    // Early termination when no overlaps
  }
}, []);
```
- **Purpose**: Resolve label-to-label overlaps without ongoing physics
- **Parameters**: 15 iterations max, 5px max nudge, 24px minimum distance
- **Implementation**: O(n²) collision detection with controlled nudging
- **Result**: Labels settle into non-overlapping positions without drift

##### **3. Adaptive Visibility Based on Zoom**
```javascript
const labelVisibility = zoomScale < 0.6 ? 0 : 
                       zoomScale < 0.7 ? (zoomScale - 0.6) / 0.1 * 0.3 :
                       zoomScale < 0.9 ? 0.3 + (zoomScale - 0.7) / 0.2 * 0.7 : 1;
```
- **Zoom Thresholds**:
  - `< 0.6`: Hidden (0% opacity)
  - `0.6-0.7`: Fade in (0-30% opacity)
  - `0.7-0.9`: Ramp up (30-100% opacity)  
  - `≥ 0.9`: Fully visible (100% opacity)
- **Result**: Labels appear/disappear intelligently based on zoom level

##### **4. Enhanced Hit Areas for Small Nodes**
```javascript
// Visual node (small)
const node = nodeElements.append('circle')
  .attr('r', visualRadius);

// Invisible hit area (minimum 16px)
const hitArea = nodeElements.append('circle')
  .attr('r', d => Math.max(visualRadius, 16))
  .attr('fill', 'transparent')
  .attr('pointer-events', 'all');
```
- **Dual Circle Architecture**: Separate visual and interaction layers
- **Minimum Hit Radius**: 16px for all nodes regardless of visual size
- **Result**: Tiny nodes (1-4px visual) have generous 32px clickable area

##### **5. White Halo Text Enhancement**
```javascript
// Background halo for contrast
const labelHalo = labelElements.append('text')
  .style('stroke', 'white')
  .style('stroke-width', '3px')
  .style('stroke-linejoin', 'round');

// Foreground readable text
const labelText = labelElements.append('text')
  .style('fill', '#333');
```
- **Dual Text Architecture**: White stroke halo + dark fill text
- **Contrast Enhancement**: 3px white stroke provides readability over any background
- **Typography**: Noto Sans, 12px, font-weight 500, middle-anchored

#### **Acceptance Criteria Met:**
- ✅ Dense expansions show readable labels with minimal overlap
- ✅ Labels don't drift or jiggle after settling (one-shot approach)
- ✅ Small nodes are easy to tap/select (16px minimum hit area)
- ✅ Labels fade intelligently based on zoom level
- ✅ High contrast text readable over any background

#### **Performance Characteristics:**
- **Label Separation**: O(n²) but capped at 15 iterations, early termination
- **Anchor Computation**: O(n) linear with node count
- **Adaptive Visibility**: O(n) per frame, minimal overhead
- **Memory Impact**: ~2x text elements (halo + foreground)

---

### **Stage 2 — POS "Orbits" (verbs inner, nouns outer)** 🚧 IN PROGRESS
**Goal**: Deterministic, collision-free placement around parent Root/Form nodes

#### **Planned Implementation:**

##### **1. Fixed Anchors**
```javascript
// Planned anchor positions
const anchors = {
  root: { x: 0.70 * width, y: 0.45 * height },  // RIGHT side
  form: { x: 0.30 * width, y: 0.45 * height }   // LEFT side
};
```

##### **2. Wedge-Based Angular Layout**
```javascript
// Planned wedge definitions
const wedges = {
  root: { minAngle: -30, maxAngle: 30 },      // RIGHT wedge
  form: { minAngle: 150, maxAngle: 210 }      // LEFT wedge  
};
```

##### **3. POS-Based Orbital Layers**
```javascript
// Planned radius bands
const orbits = {
  verbs: { inner: 120, outer: 240 },    // Inner orbit
  nouns: { inner: 280, outer: 460 }     // Outer orbit with gap
};
```

##### **4. Ring Packing Algorithm**
```javascript
// Planned ring packing logic
const computeRingPositions = (nodes, wedge, orbit) => {
  const ringSpacing = 1.1 * maxNodeDiameter;
  const angularStep = maxNodeDiameter / radius;
  const capacity = Math.floor((wedge.max - wedge.min) / angularStep);
  // Place nodes at calculated polar coordinates
};
```

---

## 🔧 **Technical Architecture**

### **Key Data Structures**
```javascript
// Stage 0: Core state
const [layoutMode, setLayoutMode] = useState('force');
const lastTransform = useRef(null);

// Stage 1: Label processing
const labelAnchors = [{
  node: nodeData,
  x: anchorX,
  y: anchorY,
  nodeRadius: calculatedRadius
}];

// Stage 2: Orbital positioning (planned)
const orbitalPositions = [{
  node: nodeData,
  anchor: 'root' | 'form',
  orbit: 'verbs' | 'nouns',
  ring: number,
  angle: degrees,
  x: computed,
  y: computed
}];
```

### **Performance Considerations**
1. **One-shot algorithms** preferred over continuous physics
2. **Early termination** in iterative processes
3. **Capped iterations** to prevent infinite loops
4. **Minimal DOM mutations** during animations
5. **Transform-based positioning** for GPU acceleration

### **Browser Compatibility**
- **D3.js v7**: All modern browsers
- **CSS transforms**: IE9+ support
- **Pointer events**: IE11+ for hit area transparency
- **SVG features**: Universal support

---

## 🧪 **Testing Strategy**

### **Stage 1 Test Scenarios**
```javascript
// Test cases implemented
const testScenarios = [
  {
    name: "Tiny nodes clickability",
    setup: "Root with 3 words (dataSize: 0-5)",
    expected: "16px hit areas, easy clicking"
  },
  {
    name: "Dense clusters readability", 
    setup: "Root with 25-35 mixed POS words",
    expected: "Non-overlapping labels, readable text"
  },
  {
    name: "Zoom-based visibility",
    setup: "Any graph, zoom 0.1x to 3.0x",
    expected: "Labels fade at thresholds: 0.6, 0.7, 0.9"
  },
  {
    name: "Label separation stability",
    setup: "Dense expansion with overlapping labels",
    expected: "Labels settle without ongoing drift"
  }
];
```

### **Stage 2 Test Scenarios (Planned)**
```javascript
const stage2Tests = [
  {
    name: "Deterministic placement",
    setup: "Same root expansion 5 times",
    expected: "Identical positions every time"
  },
  {
    name: "POS orbital separation",
    setup: "Root with mix of verbs and nouns",
    expected: "Verbs inner rings, nouns outer rings"
  },
  {
    name: "Wedge containment",
    setup: "Root expansion",
    expected: "All words within RIGHT 60° wedge"
  }
];
```

---

## 📊 **Metrics & Debugging**

### **Console Logging Format**
```javascript
// Current metrics output
📊 Graph Metrics: {
  totalNodes: 15,
  wordNodes: 12,
  labels: 15,
  avgDataSize: "156.34",
  minDataSize: 1,
  maxDataSize: 847,
  layoutMode: "force"
}
```

### **Debug Flags (Future)**
```javascript
// Planned debug visualization
const DEBUG_FLAGS = {
  showLabelAnchors: false,     // Red dots at anchor points
  showHitAreas: false,         // Outline invisible hit circles
  showWedgeBounds: false,      // Draw wedge angle limits
  showOrbitalRings: false,     // Show radius bands
  logSeparationSteps: false    // Console.log each nudge iteration
};
```

### **Performance Metrics (Future)**
```javascript
// Planned performance tracking
const performanceMetrics = {
  labelSeparationTime: 0,    // ms to separate labels
  orbitalComputeTime: 0,     // ms to compute positions
  renderTime: 0,             // ms to update DOM
  separationIterations: 0,   // actual iterations used
  frameRate: 0               // fps during animation
};
```

---

## 🔄 **Configuration & Tunables**

### **Stage 1 Configuration**
```javascript
// Current tunable parameters
const STAGE1_CONFIG = {
  labelOffset: 14,           // px from node edge
  separationIterations: 15,  // max collision resolution loops
  maxNudgeDistance: 5,       // px max movement per iteration
  minLabelDistance: 24,      // px minimum between label centers
  minHitRadius: 16,          // px minimum clickable area
  haloStrokeWidth: 3,        // px white stroke width
  zoomThresholds: {
    hidden: 0.6,             // zoom level for 0% opacity
    fadeStart: 0.7,          // zoom level for fade-in start
    visible: 0.9             // zoom level for 100% opacity
  }
};
```

### **Stage 2 Configuration (Planned)**
```javascript
const STAGE2_CONFIG = {
  anchors: {
    root: { x: 0.70, y: 0.45 },  // Relative to viewport
    form: { x: 0.30, y: 0.45 }
  },
  wedges: {
    root: { min: -30, max: 30 },   // Degrees
    form: { min: 150, max: 210 }
  },
  orbits: {
    verbs: { inner: 120, outer: 240 },   // Pixels from anchor
    nouns: { inner: 280, outer: 460 }
  },
  packing: {
    ringSpacing: 1.1,        // Multiplier for node diameter
    marginPx: 6              // Extra spacing between nodes
  }
};
```

---

## 🐛 **Known Issues & Limitations**

### **Stage 1 Issues**
1. **Label separation complexity**: O(n²) may slow with 100+ nodes
2. **Zoom-based visibility**: Labels may flicker during fast zoom
3. **Hit area overlap**: Large hit areas may create ambiguous clicks
4. **Text measurement**: SVG text width not calculated (future enhancement)

### **Future Considerations**
1. **Mobile touch targets**: May need larger hit areas on mobile
2. **Accessibility**: ARIA labels for screen readers
3. **Internationalization**: RTL text support for Arabic labels
4. **Performance**: Canvas fallback for 200+ nodes

---

## 📚 **Dependencies & External Resources**

### **Core Dependencies**
```javascript
import * as d3 from 'd3';  // v7.x - Core visualization library
// React hooks: useState, useRef, useCallback, useEffect
// Context APIs: AdvancedModeContext, WordShadeContext, etc.
```

### **Mathematical Concepts**
- **Polar coordinates**: For orbital positioning
- **Vector mathematics**: For label anchor computation  
- **Collision detection**: For label overlap resolution
- **Easing functions**: For smooth animations (Stage 3)

### **References**
- [D3.js Force Simulation](https://github.com/d3/d3-force)
- [SVG Text Positioning](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text)
- [CSS Transform Performance](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/)

---

## 🚀 **Deployment & Rollout Strategy**

### **Phase 1: Gradual Feature Flags**
```javascript
// Planned feature toggles
const FEATURE_FLAGS = {
  enableStage1Labels: true,      // ✅ Currently active
  enableStage2Orbits: false,     // 🚧 Next to implement
  enableStage3Computed: false,   // ⏳ Future
  enableStage4Camera: false,     // ⏳ Future
  enableDebugVisuals: false      // 🛠️ Development only
};
```

### **Rollback Plan**
- **Immediate**: Revert to `layoutMode = 'force'` disables new features
- **Emergency**: Git checkout to pre-overhaul commit: `9676135`
- **Gradual**: Feature flags allow selective disabling

### **Success Metrics**
- **User Engagement**: Time spent interacting with graph
- **Task Completion**: Successful node expansions/clicks
- **Performance**: Frame rate during interactions
- **User Feedback**: Subjective readability improvements

---

## 📝 **Change Log**

### **August 24, 2025**
- ✅ **Stage 0 Complete**: Layout mode flag, metrics logging, zoom persistence
- ✅ **Stage 1 Complete**: Label anchors, separation, visibility, hit areas, halos
- 🚧 **Stage 2 Started**: Documentation and planning for orbital positioning

### **Future Entries**
- [ ] Stage 2: POS orbits implementation
- [ ] Stage 3: Computed layout mode with tweening
- [ ] Stage 4: Smart camera auto-focus
- [ ] Stage 5: Advanced polish and performance

---

**Status**: Documentation complete for Stage 0-1. Ready to proceed with Stage 2 implementation.