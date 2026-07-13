import * as d3 from 'd3';
import { PHON_CLASSES } from './phonology';

// Pure geometry layer for the Projection Snapshot API. Converts a snapshot
// JSON object into fixed-viewBox coordinates + visual properties — no
// rendering, no side effects, no randomness. Same snapshot in -> same
// layout out, always, so every render is a stable visual fingerprint.
//
// Scale domains are computed live from each snapshot's own branches (the
// convention already used across every d3-based chart in this codebase —
// see FertilityGravity/ZipfChart/etc: log for skewed counts, sqrt for
// size/radius, linear 0..1 for brightness). There are no fixed/global
// domain constants — determinism comes from the layout being a pure
// function of its input, not from cross-snapshot absolute comparability.

export const VIEWBOX = [0, 0, 600, 600];
export const CENTER = { x: 300, y: 300 };

const toXY = (cx, cy, angleDeg, radius) => {
  const rad = (angleDeg - 90) * (Math.PI / 180); // 0deg = up, clockwise
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
};

// ── Radical Tree ─────────────────────────────────────────────────────────────
// center = radical. Radial dendrogram, not a decorative glyph: the tree
// preserves the actual shape of the query —
//   radical -> position (r1/r2/r3, only the ones attested)
//            -> bi-radical continuation (top CHILD_LIMIT from the API, +"other")
//                     -> root example (top ~5 from the API, +"N more" leaf)
// Angular position per node comes from d3.tree's default leaf-count-based
// spacing, so a position/continuation with more real children naturally
// claims more of the circle — that's what makes the shape asymmetric and
// data-driven instead of a fixed 3-arm icon. Radius is depth-based (one
// ring per tree level), so branches that stop early (an "other" bucket
// with nothing beneath it) visibly stop short of the outer ring.
const POSITIONS = ['r1', 'r2', 'r3'];
const TREE_MAX_RADIUS = 260;

const rootLabel = (ex) => ex.arabic || [ex.r1, ex.r2, ex.r3].filter(Boolean).join('');

function buildTreeData(snapshot) {
  const branchByPos = {};
  (snapshot?.branches || []).forEach(b => { branchByPos[b.key] = b; });

  const children = POSITIONS.filter(p => branchByPos[p]).map(position => {
    const branch = branchByPos[position];
    return {
      kind: 'position', label: position,
      roots: branch.roots, words: branch.words, corpus: branch.corpus,
      children: (branch.children || []).map(child => {
        if (child.other) {
          return {
            kind: 'other', label: child.label,
            roots: child.roots, words: child.words, corpus: child.corpus,
            children: [],
          };
        }
        const exampleLeaves = (child.examples || []).map(ex => ({
          kind: 'root', label: rootLabel(ex), example: ex,
          roots: 1, words: 0, corpus: ex.corpus,
          children: [],
        }));
        const shown = child.examples?.length || 0;
        if (child.roots > shown) {
          exampleLeaves.push({
            kind: 'other', label: `+${child.roots - shown} more`,
            roots: child.roots - shown, words: 0, corpus: 0,
            children: [],
          });
        }
        return {
          kind: 'continuation', label: child.label,
          roots: child.roots, words: child.words, corpus: child.corpus,
          children: exampleLeaves,
        };
      }),
    };
  });

  return { kind: 'center', label: snapshot?.center?.label || '', roots: 0, words: 0, corpus: 0, children };
}

export function layoutRadicalTree(snapshot) {
  const data = buildTreeData(snapshot);
  const root = d3.hierarchy(data, d => d.children);

  d3.tree()
    .size([2 * Math.PI, TREE_MAX_RADIUS])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)
    (root);

  const descendants = root.descendants();
  const withoutRoot  = descendants.filter(d => d.depth > 0);
  const maxRoots  = d3.max(withoutRoot, d => d.data.roots)  || 1;
  const maxWords  = d3.max(withoutRoot, d => d.data.words)  || 1;
  const maxCorpus = d3.max(withoutRoot, d => d.data.corpus) || 1;

  const nodeRadiusScale = d3.scaleSqrt().domain([0, maxRoots]).range([4, 16]);
  const thicknessScale  = d3.scaleSqrt().domain([0, maxWords]).range([1, 9]);
  const brightnessScale = d3.scaleLinear().domain([0, maxCorpus]).range([0.15, 1]).clamp(true);

  const nodeXY = (d) => toXY(CENTER.x, CENTER.y, d.x * (180 / Math.PI), d.y);

  const nodes = withoutRoot.map(d => {
    const { x, y } = nodeXY(d);
    const isOther = d.data.kind === 'other';
    return {
      id: d.data.label + '@' + d.depth + ':' + x.toFixed(1) + ',' + y.toFixed(1),
      kind: d.data.kind, depth: d.depth, label: d.data.label, example: d.data.example || null,
      x, y,
      r: isOther ? 3 : nodeRadiusScale(d.data.roots),
      brightness: isOther ? 0.12 : brightnessScale(d.data.corpus),
      roots: d.data.roots, words: d.data.words, corpus: d.data.corpus,
    };
  });

  const linkGen = d3.linkRadial().angle(d => d.x).radius(d => d.y);
  const links = root.links().filter(l => l.target.depth > 0).map(l => ({
    d: linkGen(l),
    thickness:  l.target.data.kind === 'other' ? 0.75 : thicknessScale(l.target.data.words),
    brightness: l.target.data.kind === 'other' ? 0.1  : brightnessScale(l.target.data.corpus),
  }));

  return {
    viewBox: VIEWBOX,
    center: { x: CENTER.x, y: CENTER.y, label: snapshot?.center?.label || '' },
    links,
    nodes,
  };
}

// ── Bi-radical Completion Mandala ───────────────────────────────────────────
// center = biradical, 29 consonants at fixed angular positions (canonical
// phonological-class order from phonology.js). Occupied r3 completions are
// visible nodes; absent ones stay faint on the baseline ring.
const RADICALS = Object.keys(PHON_CLASSES);
const RING_ANGLE_STEP = 360 / RADICALS.length;
const BASE_RADIUS = 180;
const MAX_DEPTH_EXTENT = 80;

export function layoutBiradicalMandala(snapshot) {
  const branchByKey = {};
  (snapshot?.branches || []).forEach(b => { branchByKey[b.key] = b; });
  const occupied = snapshot?.branches || [];
  const core = snapshot?.core_stats || { roots: 0, words: 0, corpus: 0 };

  const maxRoots  = d3.max(occupied, b => b.roots)  || 1;
  const maxWords  = d3.max([...occupied.map(b => b.words), core.words])  || 1;
  const maxCorpus = d3.max([...occupied.map(b => b.corpus), core.corpus]) || 1;

  const sizeScale       = d3.scaleSqrt().domain([0, maxWords]).range([4, 22]);
  const brightnessScale = d3.scaleLinear().domain([0, maxCorpus]).range([0.15, 1]).clamp(true);
  const depthScale      = d3.scaleSqrt().domain([0, maxRoots]).range([0, MAX_DEPTH_EXTENT]);

  const nodes = RADICALS.map((letter, i) => {
    const angle  = i * RING_ANGLE_STEP;
    const branch = branchByKey[letter];
    const isOccupied = !!branch;
    const radius = isOccupied ? BASE_RADIUS + depthScale(branch.roots) : BASE_RADIUS;
    const pos = toXY(CENTER.x, CENTER.y, angle, radius);
    return {
      letter, angle, x: pos.x, y: pos.y, radius, occupied: isOccupied,
      size:       isOccupied ? sizeScale(branch.words) : 2.5,
      brightness: isOccupied ? brightnessScale(branch.corpus) : 0.1,
      roots:  isOccupied ? branch.roots  : 0,
      words:  isOccupied ? branch.words  : 0,
      corpus: isOccupied ? branch.corpus : 0,
      examples: isOccupied ? branch.examples : [],
    };
  });

  return {
    viewBox: VIEWBOX,
    core: {
      x: CENTER.x, y: CENTER.y,
      occupied: core.roots > 0,
      size: core.roots > 0 ? sizeScale(core.words) : 8,
      brightness: core.roots > 0 ? brightnessScale(core.corpus) : 0.1,
      roots: core.roots, words: core.words, corpus: core.corpus,
      label: snapshot?.center?.label || '',
    },
    nodes,
  };
}
