import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PHON_CLASSES } from './phonology';

// 3D Depth Landscape
//
// Each bi-radical family with r3 data is a point in a 3D grid:
//   x = r1 consonant index (sorted list of all radicals)
//   y = r2 consonant index
//   z = r3_count (how many distinct r3 consonants complete this pair)
//
// The result is a 3D terrain of Arabic root depth.
// Tall/bright columns = deep families (many r3 options).
// Low/dark dots = shallow families (few r3 options).
// Empty positions = families that don't exist (the dark matter).
//
// Color = phonological class of r1 — so clusters of same-color
// tall columns reveal which class of consonants anchors the deepest roots.

export default function Depth3D({ data }) {
  const canvasRef    = useRef();
  const containerRef = useRef();
  const stateRef     = useRef({ rot: { x: 0.35, y: 0.4 }, zoom: 1, dragging: false, lastMouse: { x: 0, y: 0 }, lastTouch: null, pinchDist: null, raf: null });

  useEffect(() => {
    if (!data.length || !canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    // Collect all unique radicals (r1 and r2) from depths data
    const radicalSet = new Set();
    data.forEach(d => {
      const [r1, r2] = d.pair_key.split('-');
      if (r1) radicalSet.add(r1);
      if (r2) radicalSet.add(r2);
    });
    const radicals = [...radicalSet].sort();
    const n = radicals.length;
    const idxOf = r => radicals.indexOf(r);

    // Build 3D points: each family = one sphere at (r1_idx, r2_idx, r3_count)
    const maxDepth = Math.max(...data.map(d => d.r3_count), 1);
    const spread = 150; // world-space spread in x and y

    const colorScale = d3.scaleSequential(d3.interpolate('#1a0a2e', '#a855f7')).domain([0, maxDepth]);

    const pts = data.map(d => {
      const [r1, r2] = d.pair_key.split('-');
      const xi = idxOf(r1), yi = idxOf(r2);
      if (xi < 0 || yi < 0) return null;
      const clsColor = PHON_CLASSES[r1]?.color;
      // Mix class color and depth color
      const depthColor = colorScale(d.r3_count);
      return {
        x: (xi / Math.max(n - 1, 1) - 0.5) * spread * 2,
        y: -(d.r3_count / maxDepth) * 120,  // height = depth (up = deep)
        z: (yi / Math.max(n - 1, 1) - 0.5) * spread * 2,
        r3: d.r3_count,
        color: clsColor || depthColor,
        label: d.r3_count >= maxDepth * 0.7 ? d.pair_key : null,
      };
    }).filter(Boolean);

    // Projection
    let cosY, sinY, cosX, sinX;
    const updateMatrix = () => {
      cosY = Math.cos(s.rot.y); sinY = Math.sin(s.rot.y);
      cosX = Math.cos(s.rot.x); sinX = Math.sin(s.rot.x);
    };
    const project = (x, y, z, cx, cy) => {
      const rx  = x * cosY - z * sinY;
      const rz0 = x * sinY + z * cosY;
      const ry  = y * cosX - rz0 * sinX;
      const rz  = y * sinX + rz0 * cosX;
      const sc  = (500 / (500 + rz)) * s.zoom;
      return { sx: cx + rx * sc, sy: cy + ry * sc, rz };
    };

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h);
      updateMatrix();

      // Draw floor grid (faint)
      const gridSteps = 8;
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= gridSteps; i++) {
        const t = (i / gridSteps - 0.5) * spread * 2;
        const p1 = project(t, 0, -spread, cx, cy);
        const p2 = project(t, 0,  spread, cx, cy);
        ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
        const p3 = project(-spread, 0, t, cx, cy);
        const p4 = project( spread, 0, t, cx, cy);
        ctx.beginPath(); ctx.moveTo(p3.sx, p3.sy); ctx.lineTo(p4.sx, p4.sy); ctx.stroke();
      }

      // Draw vertical sticks from floor to point for deep families
      pts.forEach(p => {
        if (p.r3 < 3) return;
        const floor = project(p.x, 0, p.z, cx, cy);
        const top   = project(p.x, p.y, p.z, cx, cy);
        ctx.beginPath();
        ctx.moveTo(floor.sx, floor.sy);
        ctx.lineTo(top.sx, top.sy);
        ctx.strokeStyle = p.color + '44';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });

      // Project and sort back-to-front
      const projected = pts.map(p => ({ ...p, ...project(p.x, p.y, p.z, cx, cy) }));
      projected.sort((a, b) => b.rz - a.rz);

      ctx.textAlign = 'center';
      for (const p of projected) {
        const r = Math.max(2, Math.min(8, (p.r3 / maxDepth) * 7 + 1));
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (p.label) {
          ctx.fillStyle = '#eab308';
          ctx.font = '10px serif';
          ctx.fillText(p.label, p.sx, p.sy - r - 3);
        }
      }

      s.rot.y += 0.003;
    };

    const resize = () => { canvas.width = container.offsetWidth; canvas.height = container.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    const loop = () => { draw(); s.raf = requestAnimationFrame(loop); };
    s.raf = requestAnimationFrame(loop);

    const onDown = e => { s.dragging = true; s.lastMouse = { x: e.clientX, y: e.clientY }; };
    const onMove = e => {
      if (!s.dragging) return;
      s.rot.y += (e.clientX - s.lastMouse.x) * 0.008;
      s.rot.x += (e.clientY - s.lastMouse.y) * 0.008;
      s.lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onUp    = () => { s.dragging = false; };
    const onWheel = e => { e.preventDefault(); s.zoom = Math.max(0.3, Math.min(5, s.zoom * (e.deltaY > 0 ? 0.9 : 1.1))); };
    const touchDist = t => Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
    const onTouchStart = e => {
      e.preventDefault();
      if (e.touches.length === 2) { s.pinchDist = touchDist(e.touches); s.lastTouch = null; }
      else { s.pinchDist = null; s.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
    };
    const onTouchMove = e => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const d = touchDist(e.touches);
        if (s.pinchDist) s.zoom = Math.max(0.3, Math.min(5, s.zoom * (d / s.pinchDist)));
        s.pinchDist = d; s.lastTouch = null;
      } else if (e.touches.length === 1 && s.lastTouch) {
        s.rot.y += (e.touches[0].clientX - s.lastTouch.x) * 0.008;
        s.rot.x += (e.touches[0].clientY - s.lastTouch.y) * 0.008;
        s.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchEnd = e => {
      if (e.touches.length < 2) s.pinchDist = null;
      s.lastTouch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    };

    canvas.addEventListener('mousedown',  onDown);
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseup',    onUp);
    canvas.addEventListener('wheel',      onWheel,      { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd);

    return () => {
      cancelAnimationFrame(s.raf);
      ro.disconnect();
      canvas.removeEventListener('mousedown',  onDown);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseup',    onUp);
      canvas.removeEventListener('wheel',      onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
    };
  }, [data]);

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }} />
      <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 10, color: '#333', userSelect: 'none', lineHeight: 1.6 }}>
        floor x/y = r1 × r2 consonant indices · height = r3 depth<br />
        color = r1 phonological class · gold labels = deepest families
      </div>
    </div>
  );
}
