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
const CENTER = { x: 300, y: 300 };

const toXY = (cx, cy, angleDeg, radius) => {
  const rad = (angleDeg - 90) * (Math.PI / 180); // 0deg = up, clockwise
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
};

// ── Radical Position Signature ──────────────────────────────────────────────
// center = radical, three fixed spokes (r1/r2/r3) at 120deg apart.
const POSITIONS = ['r1', 'r2', 'r3'];
const SPOKE_ANGLES = { r1: 0, r2: 120, r3: 240 };
const SATELLITE_OFFSETS = { 1: [0], 2: [-10, 10], 3: [-14, 0, 14] };

export function layoutRadicalSignature(snapshot) {
  const branchByPos = {};
  (snapshot?.branches || []).forEach(b => { branchByPos[b.key] = b; });

  const present = POSITIONS.map(p => branchByPos[p]).filter(Boolean);
  const maxRoots  = d3.max(present, b => b.roots)  || 1;
  const maxWords  = d3.max(present, b => b.words)  || 1;
  const maxCorpus = d3.max(present, b => b.corpus) || 1;

  const lengthScale     = d3.scaleLog().domain([1, Math.max(maxRoots, 1)]).range([40, 220]).clamp(true);
  const thicknessScale  = d3.scaleSqrt().domain([0, maxWords]).range([2, 16]);
  const brightnessScale = d3.scaleLinear().domain([0, maxCorpus]).range([0.15, 1]).clamp(true);
  const satelliteRScale = d3.scaleSqrt().domain([0, maxRoots]).range([3, 11]);

  const spokes = POSITIONS.map(position => {
    const branch = branchByPos[position] || { roots: 0, words: 0, corpus: 0, satellites: [] };
    const angle  = SPOKE_ANGLES[position];
    const length = branch.roots > 0 ? lengthScale(branch.roots) : 24;
    const tip    = toXY(CENTER.x, CENTER.y, angle, length);
    const satellites = (branch.satellites || []).map((s, i) => {
      const offsets = SATELLITE_OFFSETS[Math.min(branch.satellites.length, 3)] || [0];
      const satAngle = angle + (offsets[i] ?? 0);
      const pos = toXY(CENTER.x, CENTER.y, satAngle, length + 26);
      return {
        label: s.label, x: pos.x, y: pos.y,
        r: satelliteRScale(s.roots),
        brightness: brightnessScale(s.corpus),
        roots: s.roots, words: s.words, corpus: s.corpus,
      };
    });
    return {
      position, angle,
      x1: CENTER.x, y1: CENTER.y, x2: tip.x, y2: tip.y,
      length, thickness: branch.roots > 0 ? thicknessScale(branch.words) : 1,
      brightness: branch.roots > 0 ? brightnessScale(branch.corpus) : 0.08,
      roots: branch.roots, words: branch.words, corpus: branch.corpus,
      satellites,
    };
  });

  return {
    viewBox: VIEWBOX,
    center: { x: CENTER.x, y: CENTER.y, label: snapshot?.center?.label || '' },
    spokes,
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
