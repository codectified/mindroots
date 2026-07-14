import { useEffect, useMemo, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { snapshotToGraph } from './snapshotToGraph';
import { useSize } from './shared';

const LABEL_KINDS = new Set(['center', 'position', 'continuation']);
const FONT_SIZE = { center: 44, position: 34, continuation: 26 };
const LABEL_COLOR = { center: '#eab308', position: '#e5c07b', continuation: '#cfcfcf' };

function makeLabelSprite(node) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = FONT_SIZE[node.kind] || 24;
  ctx.font = `${fontSize}px serif`;
  const text = node.label || '';
  const width = Math.ceil(ctx.measureText(text).width) + 24;
  const height = fontSize + 16;
  canvas.width = width;
  canvas.height = height;
  ctx.font = `${fontSize}px serif`;
  ctx.fillStyle = LABEL_COLOR[node.kind] || '#cfcfcf';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 12, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const scale = 0.16;
  sprite.scale.set(width * scale, height * scale, 1);
  sprite.position.set(0, (node.val || 6) + 8, 0);
  return sprite;
}

const exampleText = (ex) => ex.arabic || [ex.r1, ex.r2, ex.r3].filter(Boolean).join('');

function nodeTooltip(node) {
  if (node.kind === 'other') return `<div style="font-size:12px;color:#888">${node.label}</div>`;
  const parts = [
    `<div style="font-family:serif;font-size:16px;color:${LABEL_COLOR[node.kind] || '#eab308'}">${node.label}</div>`,
    `<div style="font-size:12px;color:#ccc">${node.roots.toLocaleString()} roots · ${node.words.toLocaleString()} words · ${node.corpus.toLocaleString()} corpus</div>`,
  ];
  if (node.examples?.length) {
    parts.push(`<div style="font-size:11px;color:#888;margin-top:2px">${node.examples.slice(0, 3).map(exampleText).join(', ')}</div>`);
  }
  return parts.join('');
}

// Standard d3-force custom-force factory: nudges nodes toward their
// assigned zone target (soft spatial region for r1/r2/r3), everything
// else about the final position still comes from link/charge forces.
function zoneForce(strength) {
  let nodes = [];
  const force = (alpha) => {
    nodes.forEach(n => {
      if (!n.zone) return;
      n.vx = (n.vx || 0) + (n.zone.x - n.x) * strength * alpha;
      n.vy = (n.vy || 0) + (n.zone.y - n.y) * strength * alpha;
      n.vz = (n.vz || 0) + (n.zone.z - n.z) * strength * alpha;
    });
  };
  force.initialize = (ns) => { nodes = ns; };
  return force;
}

// Renders a Projection Snapshot as a force-directed 3D "morphological flow"
// scene — geometry emerges from the data (fertility=size, gravity=color,
// independent channels) rather than a fixed hierarchy. Clicking a bi-radical
// family re-centers the whole scene onto it via the onRecenter callback,
// reusing ProjectionLab's existing fetch/state loop.
export default function MorphologicalFlow({ snapshot, onRecenter }) {
  const wrapRef = useRef(null);
  const fgRef = useRef(null);
  const { w, h } = useSize(wrapRef);

  const graphData = useMemo(() => snapshotToGraph(snapshot), [snapshot]);

  // One-time force tuning — the simulation re-initializes against whatever
  // the current node array is whenever graphData changes, so this only
  // needs to run once the graph instance exists.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('charge')?.strength(-90);
    fg.d3Force('link')?.distance(l => (l.target?.kind === 'other' ? 30 : 70)).strength(0.4);
    fg.d3Force('zone', zoneForce(0.05));
  }, []);

  const handleNodeClick = (node) => {
    if (node.kind === 'continuation' && node.key && onRecenter) {
      onRecenter({ centerType: 'biradical', center: node.key });
      return;
    }
    const fg = fgRef.current;
    if (!fg || node.kind === 'center') return;
    const distRatio = 1 + 60 / Math.max(1, Math.hypot(node.x || 0, node.y || 0, node.z || 0));
    fg.cameraPosition(
      { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
      node, 700
    );
  };

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <ForceGraph3D
        ref={fgRef}
        width={w}
        height={h}
        graphData={graphData}
        backgroundColor="#0a0a0f"
        showNavInfo={false}
        nodeLabel={nodeTooltip}
        nodeOpacity={0.92}
        nodeThreeObjectExtend={node => LABEL_KINDS.has(node.kind)}
        nodeThreeObject={node => (LABEL_KINDS.has(node.kind) ? makeLabelSprite(node) : undefined)}
        linkColor={() => 'rgba(255,255,255,0.18)'}
        linkWidth={l => (l.target?.kind === 'other' ? 0.3 : Math.max(0.4, Math.sqrt(l.target?.words || 0) * 0.05))}
        cooldownTicks={200}
        onEngineStop={() => fgRef.current?.zoomToFit(600, 40)}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}
