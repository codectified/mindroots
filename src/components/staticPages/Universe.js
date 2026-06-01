import { useEffect, useRef, useState } from 'react';
import { fetchObservabilityMetrics } from '../../services/apiService';

const PHI = Math.PI * (3 - Math.sqrt(5));

function fibSphere(count, radius, spread) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const y    = 1 - (i / Math.max(count - 1, 1)) * 2;
    const sinT = Math.sqrt(Math.max(0, 1 - y * y));
    const th   = PHI * i;
    const r    = radius + (Math.sin(i * 3.7) * 0.5 + 0.5) * spread - spread / 2;
    nodes.push({
      x: Math.cos(th) * sinT * r,
      y: y * radius,
      z: Math.sin(th) * sinT * r,
      s: Math.sin(i * 7.3) * 0.5 + 0.5,
    });
  }
  return nodes;
}

const FALLBACK = {
  radical_positions: 153, roots: 5164, analyses: 58,
  words: 55140, forms: 30, articles: 3, corpus_items: 78211,
};

function buildLayers(mobile) {
  const sc = mobile ? 0.15 : 0.30;
  const radicals = fibSphere(153,                          35,  5);
  const roots    = fibSphere(5164,                         90, 20);
  const analysis = fibSphere(58,                          145, 10);
  const words    = fibSphere(Math.round(55140 * sc), 200, 50);
  const forms    = fibSphere(30,                          235, 10);
  const articles = fibSphere(3,                           270, 10);
  const corpus   = fibSphere(Math.round(78211 * sc), 320, 55);

  const layers = [
    { nodes: corpus,   color: 'rgba(234,179,8,0.9)',    shadowColor: '#eab308', shadowBlur: 5,  minR: 0.6, base: 0,   sScale: 0.9 },
    { nodes: articles, color: 'rgba(249,115,22,0.95)',  shadowColor: '#f97316', shadowBlur: 14, minR: 2.0, base: 0,   sScale: 3.5 },
    { nodes: words,    color: '#ef4444',                shadowColor: null,      shadowBlur: 0,  minR: 0.3, base: 0.3, sScale: 1.2 },
    { nodes: forms,    color: '#3b82f6',                shadowColor: '#3b82f6', shadowBlur: 8,  minR: 1.5, base: 0,   sScale: 2.5 },
    { nodes: analysis, color: 'rgba(168,85,247,0.95)',  shadowColor: '#a855f7', shadowBlur: 10, minR: 1.5, base: 0,   sScale: 2.8 },
    { nodes: roots,    color: 'rgba(34,197,94,0.85)',   shadowColor: '#22c55e', shadowBlur: 6,  minR: 0.6, base: 0.8, sScale: 0.7 },
    { nodes: radicals, color: 'rgba(255,255,255,0.95)', shadowColor: '#ffffff', shadowBlur: 12, minR: 1.2, base: 0,   sScale: 2.5 },
  ];

  return { layers };
}

export default function Universe() {
  const canvasRef    = useRef();
  const containerRef = useRef();
  const stateRef     = useRef({
    rot: { x: 0.25, y: 0 }, zoom: 1,
    dragging: false, lastMouse: { x: 0, y: 0 },
    lastTouch: null, pinchDist: null,
    layers: null, raf: null,
  });
  const [metrics, setMetrics] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetchObservabilityMetrics()
      .then(d => setMetrics(d.snapshot))
      .catch(err => console.error('[Universe] metrics:', err));
  }, []);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    const s   = stateRef.current;

    const { layers } = buildLayers(window.innerWidth < 600);
    s.layers = layers;

    let cosY, sinY, cosX, sinX;
    const CULL = -80;

    const updateMatrix = () => {
      cosY = Math.cos(s.rot.y); sinY = Math.sin(s.rot.y);
      cosX = Math.cos(s.rot.x); sinX = Math.sin(s.rot.x);
    };

    const project = (n, cx, cy, persp) => {
      const rx  = n.x * cosY - n.z * sinY;
      const rz0 = n.x * sinY + n.z * cosY;
      const ry  = n.y * cosX - rz0 * sinX;
      const rz  = n.y * sinX + rz0 * cosX;
      if (rz <= CULL) return null;
      const sc = (persp / (persp + rz)) * s.zoom;
      return { sx: cx + rx * sc, sy: cy + ry * sc, sc };
    };

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2, persp = 500;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h);
      updateMatrix();

      ctx.shadowBlur = 0;
      for (const layer of s.layers) {
        ctx.shadowColor = layer.shadowColor || 'transparent';
        ctx.shadowBlur  = layer.shadowBlur;
        ctx.fillStyle   = layer.color;
        ctx.beginPath();
        for (const n of layer.nodes) {
          const p = project(n, cx, cy, persp);
          if (!p) continue;
          const r = Math.max(layer.minR, (layer.base + n.s * layer.sScale) * p.sc);
          ctx.moveTo(p.sx + r, p.sy);
          ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      s.rot.y += 0.004;
    };

    const loop = () => { draw(); s.raf = requestAnimationFrame(loop); };

    const resize = () => {
      canvas.width  = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    s.raf = requestAnimationFrame(loop);

    const onDown = e => { s.dragging = true; s.lastMouse = { x: e.clientX, y: e.clientY }; };
    const onMove = e => {
      if (!s.dragging) return;
      s.rot.y += (e.clientX - s.lastMouse.x) * 0.01;
      s.rot.x += (e.clientY - s.lastMouse.y) * 0.01;
      s.lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onUp    = () => { s.dragging = false; };
    const onWheel = e => {
      e.preventDefault();
      s.zoom = Math.max(0.3, Math.min(4, s.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    };

    const touchDist = t =>
      Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);

    const onTouchStart = e => {
      e.preventDefault();
      if (e.touches.length === 2) {
        s.pinchDist = touchDist(e.touches);
        s.lastTouch = null;
      } else {
        s.pinchDist = null;
        s.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = e => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const d = touchDist(e.touches);
        if (s.pinchDist) s.zoom = Math.max(0.3, Math.min(4, s.zoom * (d / s.pinchDist)));
        s.pinchDist = d;
        s.lastTouch = null;
      } else if (e.touches.length === 1 && s.lastTouch) {
        s.rot.y += (e.touches[0].clientX - s.lastTouch.x) * 0.01;
        s.rot.x += (e.touches[0].clientY - s.lastTouch.y) * 0.01;
        s.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchEnd = e => {
      if (e.touches.length < 2) s.pinchDist = null;
      s.lastTouch = e.touches.length === 1
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : null;
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
  }, []);

  const counts = metrics?.node_counts || {};
  const snap   = metrics?.core_snapshot;

  const legend = [
    { color: '#ffffff', label: 'Radical Positions', value: counts.radical_positions ?? FALLBACK.radical_positions },
    { color: '#22c55e', label: 'Roots',              value: counts.roots             ?? snap?.metrics?.total_roots ?? FALLBACK.roots },
    { color: '#a855f7', label: 'Analysis',           value: counts.analyses          ?? FALLBACK.analyses },
    { color: '#ef4444', label: 'Words',              value: counts.words             ?? snap?.metrics?.total_words ?? FALLBACK.words },
    { color: '#3b82f6', label: 'Forms',              value: counts.forms             ?? FALLBACK.forms },
    { color: '#f97316', label: 'Articles',           value: counts.articles          ?? FALLBACK.articles },
    { color: '#eab308', label: 'Corpus Items',       value: counts.corpus_items      ?? FALLBACK.corpus_items },
  ];

  const panel = {
    position: 'absolute',
    background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'blur(10px)',
    padding: isMobile ? '7px 10px' : '12px 16px',
    borderRadius: 8,
    fontSize: isMobile ? 10 : 12,
    lineHeight: 1.75,
    userSelect: 'none',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0a0f' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }}
      />

      {/* Legend */}
      <div style={{ ...panel, top: 16, left: 16, maxWidth: isMobile ? 138 : 'none' }}>
        {legend.map(({ color, label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: color, boxShadow: `0 0 5px ${color}`,
              marginRight: 6, flexShrink: 0,
            }} />
            <span style={{ color: '#aaa' }}>
              {label}:&nbsp;<span style={{ color: '#fff' }}>
                {value != null ? Number(value).toLocaleString() : '—'}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Observability stats — desktop only */}
      {snap && !isMobile && (
        <div style={{ ...panel, top: 16, right: 16, color: '#aaa' }}>
          <div style={{ color: '#555', fontSize: 11, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Observability</div>
          {snap.quran?.coverage_percent != null && (
            <div>Quran coverage:&nbsp;<span style={{ color: '#eab308' }}>{snap.quran.coverage_percent.toFixed(1)}%</span></div>
          )}
          {snap.quran?.linked_items != null && (
            <div>Quran linked:&nbsp;
              <span style={{ color: '#fff' }}>{Number(snap.quran.linked_items).toLocaleString()}</span>
              <span style={{ color: '#555' }}> / {Number(snap.quran.total_items).toLocaleString()}</span>
            </div>
          )}
          {snap.linkage?.roots_in_quran != null && (
            <div>Roots in Quran:&nbsp;<span style={{ color: '#22c55e' }}>{Number(snap.linkage.roots_in_quran).toLocaleString()}</span></div>
          )}
          {snap.linkage?.words_in_quran != null && (
            <div>Words in Quran:&nbsp;<span style={{ color: '#ef4444' }}>{Number(snap.linkage.words_in_quran).toLocaleString()}</span></div>
          )}
          {snap.linkage?.total_corpus_word_links != null && (
            <div>Corpus links:&nbsp;<span style={{ color: '#fff' }}>{Number(snap.linkage.total_corpus_word_links).toLocaleString()}</span></div>
          )}
          {snap.data_quality?.orphan_words != null && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1f1f1f', fontSize: 11, color: snap.data_quality.orphan_words > 0 ? '#f97316' : '#555' }}>
              Orphan words: {Number(snap.data_quality.orphan_words).toLocaleString()}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
