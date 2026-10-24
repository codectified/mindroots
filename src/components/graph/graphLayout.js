// Layout helpers for GraphVisualization's d3-force simulation.
//
// Why labels overlapped: the simulation runs with velocityDecay(0.992), which
// keeps only 0.8% of each tick's velocity. That gives the slow, smooth drift,
// but it also means forceCollide (which works through velocity) only resolves
// ~1% of an overlap per tick, and its radius ignored the label anyway. The
// simulation cooled long before labels were apart.
//
// forceLabelCollide works on positions instead, so it is unaffected by the
// damping and keeps the drift. Each node's footprint is its circle plus its
// label; overlapping footprints move apart by a share of the overlap per tick,
// along the shallower axis (rows of words spread sideways, not into a tower).

// Footprint of a node relative to its centre: circle of radius r, label of
// size w × h starting `gap` px right of the circle, vertically centred.
export const footprint = (r, w, h, gap = 4) => {
  const half = Math.max(r, h / 2);
  return { left: -r, right: r + (w ? gap + w : 0), top: -half, bottom: half };
};

// maxStep caps how far one node moves per tick, so a pile of new nodes unfolds
// over ~a second instead of jumping apart in one frame.
export const forceLabelCollide = (box, { padding = 3, strength = 0.25, iterations = 2, maxStep = 6 } = {}) => {
  let nodes = [];

  const force = () => {
    const moves = new Map(); // node → [dx, dy] this tick
    const move = (d, dx, dy) => {
      const m = moves.get(d);
      if (m) {
        m[0] += dx;
        m[1] += dy;
      } else {
        moves.set(d, [dx, dy]);
      }
    };
    for (let k = 0; k < iterations; k += 1) {
      const items = nodes.map((d) => {
        const b = box(d);
        return {
          d,
          l: d.x + b.left - padding,
          r: d.x + b.right + padding,
          t: d.y + b.top - padding,
          b: d.y + b.bottom + padding,
        };
      });
      // Sweep along x: only boxes whose x-ranges overlap need a closer look
      items.sort((a, z) => a.l - z.l);
      for (let i = 0; i < items.length; i += 1) {
        const a = items[i];
        for (let j = i + 1; j < items.length && items[j].l < a.r; j += 1) {
          const z = items[j];
          if (z.t >= a.b || a.t >= z.b) continue;
          const ox = Math.min(a.r - z.l, z.r - a.l);
          const oy = Math.min(a.b - z.t, z.b - a.t);
          const pinnedA = a.d.fx != null;
          const pinnedZ = z.d.fx != null;
          if (pinnedA && pinnedZ) continue;
          // A dragged (pinned) node stays put; the other takes the whole push
          const shareA = pinnedA ? 0 : pinnedZ ? 1 : 0.5;
          const shareZ = 1 - shareA;
          if (ox < oy) {
            const dir = Math.sign(z.d.x - a.d.x) || (Math.random() < 0.5 ? -1 : 1);
            const push = ox * strength;
            move(a.d, -dir * push * shareA, 0);
            move(z.d, dir * push * shareZ, 0);
          } else {
            const dir = Math.sign(z.d.y - a.d.y) || (Math.random() < 0.5 ? -1 : 1);
            const push = oy * strength;
            move(a.d, 0, -dir * push * shareA);
            move(z.d, 0, dir * push * shareZ);
          }
        }
      }
    }
    moves.forEach(([dx, dy], d) => {
      const len = Math.hypot(dx, dy);
      const k = len > maxStep ? maxStep / len : 1;
      d.x += dx * k;
      d.y += dy * k;
    });
  };

  force.initialize = (_) => {
    nodes = _;
  };
  return force;
};

const endId = (end) => (typeof end === 'object' && end !== null ? end.id : end);

// Bloom: nodes that have no position yet start on a small ring around a
// neighbour that has one (the node that was expanded), so they unfold out of
// their parent instead of flying in from the middle of the screen. Nodes with
// no placed neighbour (the first load) bloom from the centre. The ring keeps
// them a few px apart: coincident nodes make the charge force explode.
// Returns how many nodes were placed.
export const seedNewNodes = (nodes, links, center, ringRadius = 12) => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const isPlaced = (n) => n && n.x !== undefined && n.y !== undefined && !Number.isNaN(n.x);
  const unplaced = nodes.filter((n) => !isPlaced(n));
  if (unplaced.length === 0) return 0;

  const neighbours = new Map();
  links.forEach((l) => {
    const s = byId.get(endId(l.source));
    const t = byId.get(endId(l.target));
    if (!s || !t) return;
    if (!neighbours.has(s.id)) neighbours.set(s.id, []);
    if (!neighbours.has(t.id)) neighbours.set(t.id, []);
    neighbours.get(s.id).push(t);
    neighbours.get(t.id).push(s);
  });

  const ring = (origin, children) => {
    const turn = Math.random() * 2 * Math.PI;
    // at least `ringRadius`, and wide enough to keep neighbours ~8 px apart
    const r = Math.max(ringRadius, (children.length * 8) / (2 * Math.PI));
    children.forEach((n, i) => {
      const angle = turn + (2 * Math.PI * i) / children.length;
      n.x = origin.x + r * Math.cos(angle);
      n.y = origin.y + r * Math.sin(angle);
    });
  };

  // Breadth-first from placed nodes, so grandchildren bloom from their parent too
  let frontier = unplaced;
  for (let pass = 0; pass < 4 && frontier.length; pass += 1) {
    const byParent = new Map();
    const next = [];
    frontier.forEach((n) => {
      const parent = (neighbours.get(n.id) || []).find(isPlaced);
      if (!parent) {
        next.push(n);
      } else {
        if (!byParent.has(parent)) byParent.set(parent, []);
        byParent.get(parent).push(n);
      }
    });
    byParent.forEach((children, parent) => ring(parent, children));
    if (next.length === frontier.length) break;
    frontier = next;
  }
  if (frontier.length) ring(center, frontier);
  return unplaced.length;
};

// Pairs of footprints that still overlap by more than `tolerance` px (for
// tests and the layout harness)
export const countOverlaps = (nodes, box, tolerance = 1) => {
  let count = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i];
    const ba = box(a);
    for (let j = i + 1; j < nodes.length; j += 1) {
      const z = nodes[j];
      const bz = box(z);
      const ox = Math.min(a.x + ba.right, z.x + bz.right) - Math.max(a.x + ba.left, z.x + bz.left);
      const oy = Math.min(a.y + ba.bottom, z.y + bz.bottom) - Math.max(a.y + ba.top, z.y + bz.top);
      if (ox > tolerance && oy > tolerance) count += 1;
    }
  }
  return count;
};
