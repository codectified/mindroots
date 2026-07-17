import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { quadtree } from 'd3-quadtree';
import { fetchLexiconCloud } from '../../services/apiService';
import { useSize } from './shared';

// ─────────────────────────────────────────────────────────────────────────────
// Lexicon Morphology Landscape — client renderer for the whole-lexicon 2D point
// map served by GET /api/analytics/lexicon-cloud.
//
// One WebGL point cloud (THREE.Points), no DOM node per point. Structural points
// (families + roots) and word points are two draw layers so structure stays on
// top of the word "dust". Hover picking uses a d3-quadtree over world coords; a
// single reused tooltip div shows identity + metrics. Radical selection and
// corpus filter are applied by rewriting per-point alpha in place — no refetch,
// no relayout.
// ─────────────────────────────────────────────────────────────────────────────

const SIZE_K   = 5;   // marker px = aSize * zoom * SIZE_K (clamped in shader)
const PICK_PX  = 9;   // hover pick radius in screen pixels
const GRAY     = [0.42, 0.42, 0.46];

const L_FAMILY = 0, L_ROOT = 1, L_WORD = 2;

const VERT = `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uScale;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uScale, 1.0, 72.0);
  }
`;
const FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float edge = smoothstep(0.5, 0.30, dist);
    gl_FragColor = vec4(vColor, vAlpha * edge);
  }
`;

function hexToRgb(hex) {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return GRAY;
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

function baseAlpha(level, corpora) {
  if (level === L_FAMILY) return 0.95;
  if (level === L_ROOT) return 0.82;
  return corpora ? 0.6 : 0.2; // words: attested brighter than lexicon-only
}

export default function LexiconCloud({ highlightRadical, corpusId, surah }) {
  const wrapRef = useRef(null);
  const tipRef  = useRef(null);
  const { w, h } = useSize(wrapRef);

  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showKey, setShowKey] = useState(true);

  const sc = useRef(null); // imperative three.js scene state

  // fetch the base map once
  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    fetchLexiconCloud()
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(e => { if (alive) { setError(e.message || 'failed to load'); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  // initialize the scene once data arrives
  useEffect(() => {
    if (!data || !wrapRef.current) return;
    const wrap = wrapRef.current;
    const W = wrap.offsetWidth || 800, H = wrap.offsetHeight || 500;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x0a0a0f, 1);
    wrap.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -1000, 1000);
    const extent = data.map_extent || 4000;
    camera.position.set(0, 0, 10);
    camera.zoom = 0.9 * Math.min(W, H) / extent;
    camera.updateProjectionMatrix();

    const scene = new THREE.Scene();

    // class colors
    const clsColor = {};
    (data.legend || []).forEach(l => { clsColor[l.index] = hexToRgb(l.color); });

    // split points into structural (fam+root) and word draw layers
    const n = data.n;
    const { level, x, y, cls, size, corpora } = data;
    const structIdx = [], wordIdx = [];
    for (let i = 0; i < n; i++) (level[i] === L_WORD ? wordIdx : structIdx).push(i);

    function buildLayer(idxs) {
      const cnt = idxs.length;
      const pos = new Float32Array(cnt * 3);
      const col = new Float32Array(cnt * 3);
      const sz  = new Float32Array(cnt);
      const al  = new Float32Array(cnt);
      for (let j = 0; j < cnt; j++) {
        const i = idxs[j];
        pos[j * 3] = x[i]; pos[j * 3 + 1] = y[i]; pos[j * 3 + 2] = 0;
        const c = clsColor[cls[i]] || GRAY;
        col[j * 3] = c[0]; col[j * 3 + 1] = c[1]; col[j * 3 + 2] = c[2];
        sz[j] = size[i];
        al[j] = baseAlpha(level[i], corpora[i]);
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geom.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      geom.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
      geom.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uScale: { value: camera.zoom * SIZE_K } },
        vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending,
      });
      const pts = new THREE.Points(geom, mat);
      return { geom, mat, pts };
    }

    const words  = buildLayer(wordIdx);
    const struct = buildLayer(structIdx);
    words.pts.renderOrder = 0;
    struct.pts.renderOrder = 1;
    scene.add(words.pts);
    scene.add(struct.pts);

    // hover index: quadtree over world coords with original point index
    const qt = quadtree()
      .x(d => d.x).y(d => d.y)
      .addAll(Array.from({ length: n }, (_, i) => ({ x: x[i], y: y[i], i })));

    let raf = null;
    const pr = renderer.getPixelRatio();
    const render = () => {
      raf = null;
      const uScale = camera.zoom * SIZE_K * pr; // gl_PointSize is in physical px
      words.mat.uniforms.uScale.value = uScale;
      struct.mat.uniforms.uScale.value = uScale;
      renderer.render(scene, camera);
    };
    const requestRender = () => { if (!raf) raf = requestAnimationFrame(render); };

    // pixel → world helpers
    const size2 = () => ({ W: renderer.domElement.clientWidth, H: renderer.domElement.clientHeight });
    const toWorld = (px, py) => {
      const { W: cw, H: ch } = size2();
      const ndcX = (px / cw) * 2 - 1;
      const ndcY = -((py / ch) * 2 - 1);
      return {
        x: camera.position.x + ndcX * (cw / 2) / camera.zoom,
        y: camera.position.y + ndcY * (ch / 2) / camera.zoom,
      };
    };

    // interactions
    let panning = false, panStart = null;
    const el = renderer.domElement;

    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const before = toWorld(px, py);
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      camera.zoom = Math.max(0.01, Math.min(20, camera.zoom * factor));
      camera.updateProjectionMatrix();
      const after = toWorld(px, py);
      camera.position.x += before.x - after.x;
      camera.position.y += before.y - after.y;
      camera.updateProjectionMatrix();
      requestRender();
    };

    const onDown = (e) => {
      panning = true;
      panStart = { px: e.clientX, py: e.clientY, cx: camera.position.x, cy: camera.position.y };
      el.setPointerCapture?.(e.pointerId);
      hideTip();
    };
    const onUp = (e) => { panning = false; el.releasePointerCapture?.(e.pointerId); };

    const showTip = (i, clientX, clientY) => {
      const tip = tipRef.current; if (!tip) return;
      const lab = data.labels[i] || '—';
      const lk = data.lookup[i];
      let sub = '';
      if (lk?.kind === 'family') sub = `family · ${lk.breadth} roots · ${lk.words} words · ${lk.corpus} corpus`;
      else if (lk?.kind === 'root') sub = `root${lk.english ? ' · ' + lk.english : ''} · ${lk.depth} words`;
      else {
        const bits = data.corpora[i];
        const names = Object.entries(data.corpus_labels || {}).filter(([k]) => bits & (1 << (k - 1))).map(([, v]) => v);
        sub = names.length ? `word · ${names.join(', ')}` : 'word · lexicon only';
      }
      tip.innerHTML = `<div style="font-family:serif;font-size:16px;color:#eab308">${lab}</div><div style="font-size:11px;color:#aaa;margin-top:2px">${sub}</div>`;
      const rect = wrap.getBoundingClientRect();
      tip.style.left = (clientX - rect.left + 12) + 'px';
      tip.style.top  = (clientY - rect.top + 12) + 'px';
      tip.style.display = 'block';
    };
    const hideTip = () => { if (tipRef.current) tipRef.current.style.display = 'none'; };

    const onMove = (e) => {
      if (panning) {
        const dxw = (e.clientX - panStart.px) / camera.zoom;
        const dyw = (e.clientY - panStart.py) / camera.zoom;
        camera.position.x = panStart.cx - dxw;
        camera.position.y = panStart.cy + dyw;
        camera.updateProjectionMatrix();
        requestRender();
        return;
      }
      const rect = el.getBoundingClientRect();
      const wpt = toWorld(e.clientX - rect.left, e.clientY - rect.top);
      const found = qt.find(wpt.x, wpt.y, PICK_PX / camera.zoom);
      if (found) showTip(found.i, e.clientX, e.clientY); else hideTip();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', hideTip);

    sc.current = { renderer, camera, scene, words, struct, structIdx, wordIdx, requestRender,
      dispose() {
        if (raf) cancelAnimationFrame(raf);
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointerleave', hideTip);
        words.geom.dispose(); words.mat.dispose();
        struct.geom.dispose(); struct.mat.dispose();
        renderer.dispose();
        if (el.parentNode) el.parentNode.removeChild(el);
      },
    };
    requestRender();
    return () => { sc.current?.dispose(); sc.current = null; };
  }, [data]);

  // resize
  useEffect(() => {
    const s = sc.current; if (!s || !w || !h) return;
    s.renderer.setSize(w, h);
    s.camera.left = -w / 2; s.camera.right = w / 2; s.camera.top = h / 2; s.camera.bottom = -h / 2;
    s.camera.updateProjectionMatrix();
    s.requestRender();
  }, [w, h]);

  // overlays: radical highlight + corpus filter → rewrite alpha in place
  useEffect(() => {
    const s = sc.current; if (!s || !data) return;
    const { level, fam, corpora, labels } = data;

    // families (by index) that involve the highlighted radical
    let famSet = null;
    if (highlightRadical) {
      famSet = new Set();
      for (let i = 0; i < data.n; i++) {
        if (level[i] === L_FAMILY) {
          const [r1, r2] = (labels[i] || '').split('-');
          if (r1 === highlightRadical || r2 === highlightRadical) famSet.add(fam[i]);
        }
      }
    }
    const corpusBit = corpusId && corpusId !== 'all' ? (1 << (Number(corpusId) - 1)) : 0;

    const alphaFor = (i) => {
      let a = baseAlpha(level[i], corpora[i]);
      if (famSet && !famSet.has(fam[i])) a *= 0.06;
      if (corpusBit && !(corpora[i] & corpusBit)) a *= 0.1;
      return a;
    };

    const apply = (layer, idxs) => {
      const arr = layer.geom.getAttribute('aAlpha').array;
      for (let j = 0; j < idxs.length; j++) arr[j] = alphaFor(idxs[j]);
      layer.geom.getAttribute('aAlpha').needsUpdate = true;
    };
    apply(s.words, s.wordIdx);
    apply(s.struct, s.structIdx);
    s.requestRender();
  }, [data, highlightRadical, corpusId, surah]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative', cursor: 'grab' }}>
      {loading && <Overlay><span style={{ color: '#555' }}>building lexicon map…</span></Overlay>}
      {error && <Overlay><span style={{ color: '#ef4444' }}>{error}</span></Overlay>}
      {data && (showKey
        ? <KeyPanel data={data} corpusId={corpusId} highlightRadical={highlightRadical} onClose={() => setShowKey(false)} />
        : (
          <button onClick={() => setShowKey(true)}
            style={{ position: 'absolute', left: 12, top: 12, zIndex: 6, cursor: 'pointer',
              background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, color: '#aaa', fontSize: 11, padding: '4px 9px' }}>
            key
          </button>
        )
      )}
      <div ref={tipRef} style={{ position: 'absolute', display: 'none', pointerEvents: 'none', background: 'rgba(10,10,15,0.92)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 8px', zIndex: 5, maxWidth: 260 }} />
    </div>
  );
}

function Overlay({ children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}>
      {children}
    </div>
  );
}

// Reading key for the map — explains the three layers (size = productivity),
// color (phonetic class), brightness (corpus attestation), and shows the
// active radical / corpus overlay.
const dot = (px, color) => (
  <span style={{ width: px, height: px, borderRadius: px, background: color, display: 'inline-block', flexShrink: 0 }} />
);
const rowStyle = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#bbb', minHeight: 16 };
const headStyle = { fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', marginTop: 9, marginBottom: 3 };

function KeyPanel({ data, corpusId, highlightRadical, onClose }) {
  const scope = corpusId && corpusId !== 'all' ? (data.corpus_labels?.[corpusId] || `corpus ${corpusId}`) : 'entire lexicon';
  return (
    <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 6, width: 210, pointerEvents: 'auto',
      background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
      padding: '10px 12px', color: '#bbb', font: '400 12px/1.4 system-ui, sans-serif', backdropFilter: 'blur(2px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#ddd', letterSpacing: '0.04em' }}>LEXICON MAP</span>
        <span onClick={onClose} style={{ cursor: 'pointer', color: '#666', fontSize: 14, lineHeight: 1 }}>×</span>
      </div>
      <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>each point is a morphological entity, nested by lineage</div>

      <div style={headStyle}>layers · size = productivity</div>
      <div style={rowStyle}>{dot(13, '#e5c07b')}<span>family — bi-radical · size ∝ roots</span></div>
      <div style={rowStyle}>{dot(8, '#e5c07b')}<span>root — triliteral · size ∝ words</span></div>
      <div style={rowStyle}>{dot(4, '#8a8a8a')}<span>word — lexical entry</span></div>

      <div style={headStyle}>color = sound class</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(data.legend || []).map(l => (
          <span key={l.index} style={{ ...rowStyle, gap: 4, fontSize: 10 }}>{dot(8, l.color)}<span>{l.name}</span></span>
        ))}
      </div>

      <div style={headStyle}>brightness = attestation</div>
      <div style={{ fontSize: 10, color: '#999' }}>bright = attested in a corpus · faint = lexicon only</div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 9, paddingTop: 7, fontSize: 10, color: '#888' }}>
        <div>drag to pan · scroll to zoom · hover for details</div>
        <div style={{ marginTop: 4, color: '#aaa' }}>
          scope: <span style={{ color: '#eab308' }}>{scope}</span>
          {highlightRadical && <> · radical: <span style={{ fontFamily: 'serif', color: '#eab308' }}>{highlightRadical}</span></>}
        </div>
        <div style={{ marginTop: 4, color: '#666' }}>
          {data.counts.families} families · {data.counts.roots.toLocaleString()} roots · {data.counts.words.toLocaleString()} words
        </div>
      </div>
    </div>
  );
}
