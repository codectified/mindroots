import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// 3D canvas scatter — fertility × gravity × form diversity
// Same projection math as Universe.js (rotation about X and Y, perspective divide).
// Color encodes gravity-per-word ratio (the "density" axis from the original analysis).
// Auto-rotates; drag to override, scroll to zoom.

export default function Scatter3D({ data }) {
  const canvasRef    = useRef();
  const containerRef = useRef();
  const stateRef     = useRef({
    rot: { x: 0.25, y: 0 }, zoom: 1,
    dragging: false, lastMouse: { x: 0, y: 0 },
    lastTouch: null, pinchDist: null,
    raf: null,
  });

  useEffect(() => {
    if (!data.length || !canvasRef.current || !containerRef.current) return;
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    const ctx       = canvas.getContext('2d');
    const s         = stateRef.current;

    // ── data prep ───────────────────────────────────────────────
    const valid = data.filter(d => d.total_words > 0 && d.total_corpus > 0);

    // log-transform all three axes (all are heavily skewed)
    const lw = valid.map(d => Math.log1p(d.total_words));
    const lc = valid.map(d => Math.log1p(d.total_corpus));
    const lr = valid.map(d => Math.log1p(d.root_count));

    const norm = (arr, scale) => {
      const lo = Math.min(...arr), hi = Math.max(...arr);
      const mid = (lo + hi) / 2, range = hi - lo || 1;
      return arr.map(v => ((v - mid) / range) * scale * 2);
    };

    const xs = norm(lw, 160);
    const ys = norm(lc, 160);
    const zs = norm(lr,  80);

    // Color by corpus/word ratio, but use percentile clamping so colors spread evenly
    const ratios = valid.map(d => d.total_corpus / Math.max(d.total_words, 1));
    ratios.sort((a, b) => a - b);
    const p10 = ratios[Math.floor(ratios.length * 0.10)];
    const p90 = ratios[Math.floor(ratios.length * 0.90)];
    const colorFn = d3.scaleSequential(d3.interpolateRdYlGn).domain([p90, p10]);
    const rScale  = d3.scaleSqrt()
      .domain([0, Math.max(...valid.map(d => d.root_count))])
      .range([2, 10]);

    // outlier labels — top by corpus, top by words, top by ratio
    const top = new Set([
      ...[...valid].sort((a, b) => b.total_corpus - a.total_corpus).slice(0, 6),
      ...[...valid].sort((a, b) => b.total_words  - a.total_words).slice(0, 6),
      ...[...valid].sort((a, b) => (b.total_corpus / b.total_words) - (a.total_corpus / a.total_words)).slice(0, 6),
    ].map(d => d.pair_key));

    const pts = valid.map((d, i) => ({
      x: xs[i], y: -ys[i], z: zs[i],   // flip y so high corpus = up
      r: rScale(d.root_count),
      color: colorFn(ratios[i]),
      label: top.has(d.pair_key) ? d.pair_key : null,
    }));

    // ── projection ──────────────────────────────────────────────
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

    // axis endpoints
    const AXES = [
      { end: [200, 0, 0],  label: 'words',        color: '#2d4a2d' },
      { end: [0, -200, 0], label: 'corpus',       color: '#4a2d2d' },
      { end: [0, 0, 200],  label: 'family size',  color: '#2d2d4a' },
    ];

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h);
      updateMatrix();

      // axes
      AXES.forEach(ax => {
        const p = project(...ax.end, cx, cy);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.sx, p.sy);
        ctx.strokeStyle = ax.color;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ax.label, p.sx + 4, p.sy + 3);
      });

      // project & sort back-to-front
      const projected = pts.map(p => ({ ...p, ...project(p.x, p.y, p.z, cx, cy) }));
      projected.sort((a, b) => b.rz - a.rz);

      ctx.textAlign = 'center';
      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        if (p.label) {
          ctx.fillStyle = '#eab308';
          ctx.font = '11px serif';
          ctx.fillText(p.label, p.sx, p.sy - p.r - 4);
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

    // ── interaction ─────────────────────────────────────────────
    const onDown = e => { s.dragging = true; s.lastMouse = { x: e.clientX, y: e.clientY }; };
    const onMove = e => {
      if (!s.dragging) return;
      s.rot.y += (e.clientX - s.lastMouse.x) * 0.008;
      s.rot.x += (e.clientY - s.lastMouse.y) * 0.008;
      s.lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onUp    = () => { s.dragging = false; };
    const onWheel = e => {
      e.preventDefault();
      s.zoom = Math.max(0.3, Math.min(5, s.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    };
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
      <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 11, color: '#333', userSelect: 'none' }}>
        x = words · y = corpus · z = family size (roots) · color = corpus-per-word ratio
      </div>
      {/* color legend */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#444', fontSize: 11 }}>low ratio</span>
        <svg width={80} height={10}>
          <defs>
            <linearGradient id="s3d-grad">
              <stop offset="0%"   stopColor="#22c55e" />
              <stop offset="50%"  stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <rect width={80} height={10} rx={3} fill="url(#s3d-grad)" />
        </svg>
        <span style={{ color: '#444', fontSize: 11 }}>high ratio</span>
      </div>
    </div>
  );
}
