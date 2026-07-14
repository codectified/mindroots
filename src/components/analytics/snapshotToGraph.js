import * as d3 from 'd3';

// Pure data transform for the Morphological Flow view. Converts a
// Projection Snapshot into { nodes, links } for react-force-graph-3d.
// No rendering, no forces — those live in MorphologicalFlow.js. Mirrors
// the fetch/layout/render separation already established for the SVG
// views (projectionLayout.js).
//
// Two independent visual channels, never collapsed into one score:
//   fertility (structural root count)  -> node.val   (size)
//   gravity   (words+corpus weight)    -> node.color  (brightness)

const glyphColor = d3.interpolate('#241a33', '#eab308');
const OTHER_COLOR = '#3a3a44';
const OTHER_SIZE = 2;
const CENTER_MIN_SIZE = 10;

// Soft attraction targets for r1/r2/r3 — MorphologicalFlow's zone force
// nudges nodes toward these, real spread still comes from link/charge forces.
const ZONE_RADIUS = 150;
const POSITIONS = ['r1', 'r2', 'r3'];
const ZONES = POSITIONS.reduce((acc, pos, i) => {
  const angle = (i / POSITIONS.length) * 2 * Math.PI;
  acc[pos] = { x: ZONE_RADIUS * Math.cos(angle), y: 0, z: ZONE_RADIUS * Math.sin(angle) };
  return acc;
}, {});

function buildScales(measuredNodes) {
  const maxRoots  = d3.max(measuredNodes, n => n.roots)  || 1;
  const maxWords  = d3.max(measuredNodes, n => n.words)  || 1;
  const maxCorpus = d3.max(measuredNodes, n => n.corpus) || 1;
  return {
    size:       d3.scaleSqrt().domain([0, maxRoots]).range([3, 22]),
    brightness: d3.scaleLinear().domain([0, maxCorpus]).range([0.15, 1]).clamp(true),
    maxWords,
  };
}

const applyMeasured = (node, scales) => ({
  ...node,
  val:   scales.size(node.roots),
  color: glyphColor(scales.brightness(node.corpus)),
});

const applyOther = (node) => ({ ...node, val: OTHER_SIZE, color: OTHER_COLOR });

export function snapshotToGraph(snapshot) {
  if (!snapshot) return { nodes: [], links: [] };

  if (snapshot.projection === 'by_position') return byPositionGraph(snapshot);
  if (snapshot.projection === 'r3_completions') return r3CompletionsGraph(snapshot);
  return { nodes: [], links: [] };
}

function byPositionGraph(snapshot) {
  const branches = snapshot.branches || [];

  const measured = [];
  branches.forEach(b => {
    measured.push({ roots: b.roots, words: b.words, corpus: b.corpus });
    (b.children || []).forEach(c => { if (!c.other) measured.push({ roots: c.roots, words: c.words, corpus: c.corpus }); });
  });
  const scales = buildScales(measured);

  // radical center has no direct "root" identity of its own — fixed appearance, it's the pivot.
  const center = {
    id: 'center', kind: 'center', depth: 0, label: snapshot.center?.label,
    fx: 0, fy: 0, fz: 0, roots: 0, words: 0, corpus: 0,
    val: CENTER_MIN_SIZE, color: '#eab308',
  };

  const nodes = [center];
  const links = [];

  branches.forEach(b => {
    const posId = `pos:${b.key}`;
    const zone  = ZONES[b.key];
    nodes.push(applyMeasured({
      id: posId, kind: 'position', depth: 1, label: b.key, key: b.key,
      roots: b.roots, words: b.words, corpus: b.corpus, zone,
    }, scales));
    links.push({ source: 'center', target: posId });

    (b.children || []).forEach(c => {
      const childId = `child:${b.key}:${c.key}`;
      const base = { id: childId, depth: 2, label: c.label, key: c.key, examples: c.examples || [], zone,
        roots: c.roots, words: c.words, corpus: c.corpus };
      nodes.push(c.other
        ? applyOther({ ...base, kind: 'other' })
        : applyMeasured({ ...base, kind: 'continuation' }, scales));
      links.push({ source: posId, target: childId });
    });
  });

  return { nodes, links };
}

function r3CompletionsGraph(snapshot) {
  const branches = snapshot.branches || [];
  const core = snapshot.core_stats || { roots: 0, words: 0, corpus: 0 };

  const scales = buildScales([...branches.map(b => ({ roots: b.roots, words: b.words, corpus: b.corpus })), core]);

  const center = applyMeasured({
    id: 'center', kind: 'center', depth: 0, label: snapshot.center?.label,
    fx: 0, fy: 0, fz: 0, roots: core.roots, words: core.words, corpus: core.corpus,
  }, scales);
  center.val = Math.max(CENTER_MIN_SIZE, center.val);

  const nodes = [center];
  const links = [];

  branches.forEach(b => {
    const id = `r3:${b.key}`;
    nodes.push(applyMeasured({
      id, kind: 'continuation', depth: 1, label: b.key, key: b.key,
      examples: b.examples || [], roots: b.roots, words: b.words, corpus: b.corpus,
    }, scales));
    links.push({ source: 'center', target: id });
  });

  return { nodes, links };
}
