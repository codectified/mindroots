import { footprint, forceLabelCollide, seedNewNodes, countOverlaps } from './graphLayout';

const box = (d) => footprint(5, d.w, 20);
const tick = (force, n) => {
  for (let i = 0; i < n; i += 1) force();
};

test('footprint covers the circle and the label to its right', () => {
  expect(footprint(10, 50, 20, 4)).toEqual({ left: -10, right: 64, top: -10, bottom: 10 });
  expect(footprint(4, 0, 24)).toEqual({ left: -4, right: 4, top: -12, bottom: 12 });
});

test('overlapping labels are pushed apart, a few px per tick', () => {
  const nodes = [
    { id: 'a', x: 0, y: 0, w: 60 },
    { id: 'b', x: 20, y: 2, w: 60 },
    { id: 'c', x: 10, y: -3, w: 60 },
  ];
  const force = forceLabelCollide(box, { maxStep: 6 });
  force.initialize(nodes);
  const before = nodes.map((n) => [n.x, n.y]);
  force();
  nodes.forEach((n, i) => expect(Math.hypot(n.x - before[i][0], n.y - before[i][1])).toBeLessThanOrEqual(6.0001));
  tick(force, 200);
  expect(countOverlaps(nodes, box)).toBe(0);
});

test('a dragged (pinned) node is not moved; the other one gives way', () => {
  const nodes = [
    { id: 'a', x: 0, y: 0, w: 40, fx: 0, fy: 0 },
    { id: 'b', x: 10, y: 0, w: 40 },
  ];
  const force = forceLabelCollide(box);
  force.initialize(nodes);
  tick(force, 100);
  expect(nodes[0]).toMatchObject({ x: 0, y: 0 });
  expect(countOverlaps(nodes, box)).toBe(0);
});

test('new nodes bloom from the node they were expanded from', () => {
  const nodes = [
    { id: 'root', x: 300, y: 200 },
    { id: 'w1' },
    { id: 'w2' },
    { id: 'w3' },
    { id: 'grandchild' },
    { id: 'orphan' },
  ];
  const links = [
    { source: { id: 'root' }, target: 'w1' },
    { source: 'root', target: 'w2' },
    { source: 'w3', target: 'root' },
    { source: 'w1', target: 'grandchild' },
  ];
  expect(seedNewNodes(nodes, links, { x: 0, y: 0 })).toBe(5);
  ['w1', 'w2', 'w3'].forEach((id) => {
    const n = nodes.find((m) => m.id === id);
    expect(Math.hypot(n.x - 300, n.y - 200)).toBeCloseTo(12, 5);
  });
  const w1 = nodes.find((n) => n.id === 'w1');
  const g = nodes.find((n) => n.id === 'grandchild');
  expect(Math.hypot(g.x - w1.x, g.y - w1.y)).toBeCloseTo(12, 5);
  const orphan = nodes.find((n) => n.id === 'orphan');
  expect(Math.hypot(orphan.x, orphan.y)).toBeCloseTo(12, 5); // no placed neighbour → the centre
  expect(nodes[0]).toMatchObject({ x: 300, y: 200 }); // placed nodes stay where they are
});

test('a big expansion gets a wider ring so siblings do not start on top of each other', () => {
  const nodes = [{ id: 'root', x: 0, y: 0 }, ...Array.from({ length: 50 }, (_, i) => ({ id: `w${i}` }))];
  const links = nodes.slice(1).map((n) => ({ source: 'root', target: n.id }));
  seedNewNodes(nodes, links, { x: 0, y: 0 });
  const r = Math.hypot(nodes[1].x, nodes[1].y);
  expect(r).toBeCloseTo((50 * 8) / (2 * Math.PI), 5);
});
