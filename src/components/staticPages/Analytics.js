import { useEffect, useState, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { fetchBiradicals, fetchRadicalPositions, fetchR3Depth } from '../../services/apiService';
import { useSize } from '../analytics/shared';
import { PHON_CLASSES, CLASS_META, sameClass } from '../analytics/phonology';
import Scatter3D    from '../analytics/Scatter3D';
import DepthMap     from '../analytics/DepthMap';
import NetworkGraph from '../analytics/NetworkGraph';

// ─── Chart 1 · Fertility vs Gravity ─────────────────────────────────────────

function ScatterChart({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);
  const m = { top: 40, right: 40, bottom: 60, left: 70 };

  const filtered = useMemo(() => data.filter(d => d.total_words > 0 && d.total_corpus > 0), [data]);
  const xScale = useMemo(() => d3.scaleLog().domain([1, d3.max(filtered, d => d.total_words) || 1]).range([m.left, w - m.right]).nice(), [filtered, w]); // eslint-disable-line
  const yScale = useMemo(() => d3.scaleLog().domain([1, d3.max(filtered, d => d.total_corpus) || 1]).range([h - m.bottom, m.top]).nice(), [filtered, h]); // eslint-disable-line
  const rScale = useMemo(() => d3.scaleSqrt().domain([0, d3.max(filtered, d => d.root_count) || 1]).range([3, 18]), [filtered]);

  const outliers = useMemo(() => {
    const byCorpus = [...filtered].sort((a, b) => b.total_corpus - a.total_corpus).slice(0, 6);
    const byWords  = [...filtered].sort((a, b) => b.total_words  - a.total_words).slice(0, 6);
    const byRatio  = [...filtered].map(d => ({ ...d, ratio: d.total_corpus / Math.max(d.total_words, 1) })).sort((a, b) => b.ratio - a.ratio).slice(0, 6);
    return new Set([...byCorpus, ...byWords, ...byRatio].map(d => d.pair_key));
  }, [filtered]);

  const xMid = Math.sqrt(xScale.domain()[0] * xScale.domain()[1]);
  const yMid = Math.sqrt(yScale.domain()[0] * yScale.domain()[1]);
  const quadrants = [
    { label: 'civilizations',   x: xMid * 8,   y: yMid * 8   },
    { label: 'word factories',  x: xMid * 8,   y: yMid * 0.1 },
    { label: 'sacred cores',    x: xMid * 0.1, y: yMid * 8   },
    { label: 'quiet provinces', x: xMid * 0.1, y: yMid * 0.1 },
  ];

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <line x1={xScale(xMid)} y1={m.top} x2={xScale(xMid)} y2={h - m.bottom} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
        <line x1={m.left} y1={yScale(yMid)} x2={w - m.right} y2={yScale(yMid)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
        {quadrants.map(q => {
          const px = xScale(Math.max(xScale.domain()[0], Math.min(xScale.domain()[1], q.x)));
          const py = yScale(Math.max(yScale.domain()[0], Math.min(yScale.domain()[1], q.y)));
          return <text key={q.label} x={px} y={py} textAnchor="middle" fill="rgba(255,255,255,0.08)" fontSize={11} fontStyle="italic">{q.label}</text>;
        })}
        {xScale.ticks(6).map(t => (
          <g key={t} transform={`translate(${xScale(t)},${h - m.bottom})`}>
            <line y2={5} stroke="rgba(255,255,255,0.2)" />
            <text y={18} textAnchor="middle" fill="#555" fontSize={10}>{d3.format('~s')(t)}</text>
          </g>
        ))}
        <text x={(m.left + w - m.right) / 2} y={h - 10} textAnchor="middle" fill="#444" fontSize={12}>lexical fertility (words)</text>
        {yScale.ticks(6).map(t => (
          <g key={t} transform={`translate(${m.left},${yScale(t)})`}>
            <line x2={-5} stroke="rgba(255,255,255,0.2)" />
            <text x={-10} dy="0.35em" textAnchor="end" fill="#555" fontSize={10}>{d3.format('~s')(t)}</text>
          </g>
        ))}
        <text transform={`translate(16,${(m.top + h - m.bottom) / 2}) rotate(-90)`} textAnchor="middle" fill="#444" fontSize={12}>corpus gravity (occurrences)</text>
        {filtered.map(d => {
          const cx = xScale(d.total_words), cy = yScale(d.total_corpus);
          const r  = rScale(d.root_count);
          const isOut = outliers.has(d.pair_key), isHov = hovered?.pair_key === d.pair_key;
          return (
            <g key={d.pair_key} onMouseEnter={() => setHovered(d)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'default' }}>
              <circle cx={cx} cy={cy} r={r} fill={isHov ? '#fff' : isOut ? '#eab308' : 'rgba(34,197,94,0.6)'} stroke={isHov || isOut ? (isHov ? '#fff' : '#eab308') : 'none'} strokeWidth={1} />
              {isOut && <text x={cx} y={cy - r - 4} textAnchor="middle" fill="#eab308" fontSize={11} style={{ fontFamily: 'serif', direction: 'rtl' }}>{d.pair_key}</text>}
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none' }}>
          <div style={{ fontSize: 20, fontFamily: 'serif', direction: 'rtl', color: '#eab308', marginBottom: 4 }}>{hovered.pair_key}</div>
          <div style={{ color: '#aaa' }}>roots: <span style={{ color: '#fff' }}>{hovered.root_count}</span></div>
          <div style={{ color: '#aaa' }}>words: <span style={{ color: '#22c55e' }}>{hovered.total_words.toLocaleString()}</span></div>
          <div style={{ color: '#aaa' }}>corpus: <span style={{ color: '#ef4444' }}>{hovered.total_corpus.toLocaleString()}</span></div>
          <div style={{ color: '#aaa' }}>gravity/word: <span style={{ color: '#a855f7' }}>{(hovered.total_corpus / Math.max(hovered.total_words, 1)).toFixed(1)}×</span></div>
        </div>
      )}
    </div>
  );
}

// ─── Chart 2 · Bi-Radical Heatmap (with phonological overlay) ───────────────

function Heatmap({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);
  const [phonMode, setPhonMode] = useState(false);

  const { radicals, matrix, colorScale, ocpStats } = useMemo(() => {
    const r1set = new Set(), r2set = new Set();
    data.forEach(d => { const [a, b] = d.pair_key.split('-'); if (a) r1set.add(a); if (b) r2set.add(b); });
    const allR = [...new Set([...r1set, ...r2set])].sort();
    const map  = {};
    data.forEach(d => { map[d.pair_key] = d; });
    const color = d3.scaleSequential(d3.interpolate('#111827', '#eab308')).domain([0, d3.max(data, d => d.root_count) || 1]);

    // OCP stats: same-class pairs vs cross-class pairs, populated %
    let sameTotal = 0, samePop = 0, crossTotal = 0, crossPop = 0;
    allR.forEach(r1 => allR.forEach(r2 => {
      if (r1 === r2) return;
      const sc = sameClass(r1, r2);
      const pop = !!map[`${r1}-${r2}`];
      if (sc) { sameTotal++; if (pop) samePop++; }
      else    { crossTotal++; if (pop) crossPop++; }
    }));

    return { radicals: allR, matrix: map, colorScale: color, ocpStats: { sameTotal, samePop, crossTotal, crossPop } };
  }, [data]);

  const n = radicals.length;
  const labelPad = 28;
  const cellSize = Math.min(Math.floor((Math.min(w, h) - labelPad * 2) / n), 22);
  const offsetX  = (w - cellSize * n - labelPad) / 2 + labelPad;
  const offsetY  = (h - cellSize * n - labelPad) / 2 + labelPad;

  const samePct  = ocpStats.sameTotal  ? ((ocpStats.samePop  / ocpStats.sameTotal)  * 100).toFixed(1) : '—';
  const crossPct = ocpStats.crossTotal ? ((ocpStats.crossPop / ocpStats.crossTotal) * 100).toFixed(1) : '—';

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {radicals.map((rad, ci) => (
          <text key={`c-${rad}`} x={offsetX + ci * cellSize + cellSize / 2} y={offsetY - 6}
            textAnchor="middle" fill={phonMode ? (PHON_CLASSES[rad]?.color || '#666') : '#555'}
            fontSize={Math.min(cellSize - 2, 11)} style={{ fontFamily: 'serif', direction: 'rtl' }}>
            {rad}
          </text>
        ))}
        {radicals.map((rad, ri) => (
          <text key={`r-${rad}`} x={offsetX - 6} y={offsetY + ri * cellSize + cellSize / 2}
            textAnchor="end" dominantBaseline="middle"
            fill={phonMode ? (PHON_CLASSES[rad]?.color || '#666') : '#555'}
            fontSize={Math.min(cellSize - 2, 11)} style={{ fontFamily: 'serif', direction: 'rtl' }}>
            {rad}
          </text>
        ))}
        {radicals.map((r1, ri) =>
          radicals.map((r2, ci) => {
            const key  = `${r1}-${r2}`;
            const d    = matrix[key];
            const isHov = hovered?.pair_key === key;
            const isSC  = phonMode && sameClass(r1, r2);
            return (
              <rect key={key}
                x={offsetX + ci * cellSize} y={offsetY + ri * cellSize}
                width={cellSize - 1} height={cellSize - 1}
                fill={d ? colorScale(d.root_count) : '#111827'}
                stroke={isHov ? '#fff' : isSC && !d ? 'rgba(239,68,68,0.4)' : 'none'}
                strokeWidth={isHov ? 1.5 : 0.8}
                onMouseEnter={() => setHovered(d ? { ...d } : { pair_key: key, empty: true })}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })
        )}
      </svg>

      {/* phonology toggle */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setPhonMode(m => !m)} style={{
          padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
          background: phonMode ? 'rgba(239,68,68,0.15)' : 'transparent',
          border: `1px solid ${phonMode ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
          color: phonMode ? '#ef4444' : '#555',
        }}>
          OCP overlay
        </button>
        {phonMode && (
          <span style={{ fontSize: 11, color: '#555' }}>
            same-class: <span style={{ color: '#eab308' }}>{samePct}%</span> populated
            &nbsp;· cross-class: <span style={{ color: '#22c55e' }}>{crossPct}%</span> populated
          </span>
        )}
      </div>

      {/* phon legend */}
      {phonMode && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(CLASS_META).map(([cls, meta]) => (
            <span key={cls} style={{ fontSize: 10, color: meta.color, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.color, display: 'inline-block', flexShrink: 0 }} />
              {meta.label}
            </span>
          ))}
        </div>
      )}

      {hovered && (
        <div style={{ position: 'absolute', bottom: 40, right: 16, background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none' }}>
          <div style={{ fontSize: 20, fontFamily: 'serif', direction: 'rtl', color: '#eab308', marginBottom: 4 }}>{hovered.pair_key}</div>
          {hovered.empty ? (
            <div style={{ color: '#444', fontStyle: 'italic' }}>unmapped — measurable absence</div>
          ) : (
            <>
              <div style={{ color: '#aaa' }}>roots: <span style={{ color: '#fff' }}>{hovered.root_count}</span></div>
              <div style={{ color: '#aaa' }}>words: <span style={{ color: '#22c55e' }}>{hovered.total_words?.toLocaleString()}</span></div>
              <div style={{ color: '#aaa' }}>corpus: <span style={{ color: '#ef4444' }}>{hovered.total_corpus?.toLocaleString()}</span></div>
            </>
          )}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#333', fontSize: 11 }}>0 roots</span>
        <svg width={120} height={10}>
          <defs>
            <linearGradient id="hm-grad2">
              <stop offset="0%"   stopColor="#111827" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          <rect width={120} height={10} rx={3} fill="url(#hm-grad2)" />
        </svg>
        <span style={{ color: '#555', fontSize: 11 }}>many roots</span>
      </div>
    </div>
  );
}

// ─── Chart 3 · Radical Position Ecology ─────────────────────────────────────

const POS_COLORS = { r1: '#22c55e', r2: '#3b82f6', r3: '#a855f7' };
const METRICS = [{ key: 'roots', label: 'roots' }, { key: 'words', label: 'words' }, { key: 'corpus', label: 'corpus gravity' }];

function EcologyChart({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [metric, setMetric] = useState('roots');
  const [hovered, setHovered] = useState(null);

  const { radicals, grouped, maxVal } = useMemo(() => {
    const g = {};
    data.forEach(d => {
      if (!g[d.radical]) g[d.radical] = { r1: 0, r2: 0, r3: 0 };
      g[d.radical][d.position] = d[metric];
    });
    const rads = Object.keys(g).sort();
    const mv   = d3.max(rads, r => Math.max(g[r].r1, g[r].r2, g[r].r3)) || 1;
    return { radicals: rads, grouped: g, maxVal: mv };
  }, [data, metric]);

  const m = { top: 8, right: 16, bottom: 8, left: 36 };
  const rowH   = Math.max(14, Math.min(24, Math.floor((h - m.top - m.bottom) / (radicals.length || 1))));
  const barH   = Math.floor(rowH * 0.28);
  const barGap = 2;
  const maxBarW = w - m.left - m.right;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', flexShrink: 0 }}>
        {METRICS.map(mx => (
          <button key={mx.key} onClick={() => setMetric(mx.key)} style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: metric === mx.key ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.15)', color: metric === mx.key ? '#fff' : '#555',
          }}>{mx.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {['r1','r2','r3'].map(p => (
            <span key={p} style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: POS_COLORS[p], display: 'inline-block' }} /> {p}
            </span>
          ))}
        </div>
      </div>
      <div ref={wrapRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <svg width={w} height={Math.max(h, radicals.length * rowH + m.top + m.bottom)} style={{ display: 'block' }}>
          {radicals.map((rad, ri) => {
            const g = grouped[rad], y0 = m.top + ri * rowH, isHov = hovered === rad;
            return (
              <g key={rad} onMouseEnter={() => setHovered(rad)} onMouseLeave={() => setHovered(null)}>
                {isHov && <rect x={0} y={y0} width={w} height={rowH} fill="rgba(255,255,255,0.03)" />}
                <text x={m.left - 4} y={y0 + rowH / 2} textAnchor="end" dominantBaseline="middle"
                  fill={isHov ? '#fff' : '#666'} fontSize={Math.min(rowH - 2, 13)} style={{ fontFamily: 'serif' }}>
                  {rad}
                </text>
                {['r1','r2','r3'].map((pos, pi) => {
                  const val = g?.[pos] || 0;
                  const bw  = (val / maxVal) * maxBarW;
                  const by  = y0 + (rowH - (barH * 3 + barGap * 2)) / 2 + pi * (barH + barGap);
                  return <rect key={pos} x={m.left} y={by} width={Math.max(1, bw)} height={barH} fill={POS_COLORS[pos]} opacity={0.8} rx={1} />;
                })}
              </g>
            );
          })}
        </svg>
        {hovered && grouped[hovered] && (
          <div style={{ position: 'absolute', top: 8, right: 24, background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none' }}>
            <div style={{ fontSize: 20, fontFamily: 'serif', color: '#eab308', marginBottom: 4 }}>{hovered}</div>
            {['r1','r2','r3'].map(p => (
              <div key={p} style={{ color: '#aaa' }}>{p}: <span style={{ color: POS_COLORS[p] }}>{(grouped[hovered][p] || 0).toLocaleString()}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Analytics Page ─────────────────────────────────────────────────────

const CHARTS = [
  { id: 1, label: 'Fertility × Gravity' },
  { id: 2, label: 'Bi-Radical Heatmap' },
  { id: 3, label: 'Position Ecology' },
  { id: 4, label: '3D Space' },
  { id: 5, label: 'r3 Depth' },
  { id: 6, label: 'Radical Network' },
];

export default function Analytics() {
  const [biradicals, setBiradicals] = useState([]);
  const [positions,  setPositions]  = useState([]);
  const [depths,     setDepths]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [chart,      setChart]      = useState(1);

  useEffect(() => {
    Promise.all([fetchBiradicals(), fetchRadicalPositions(), fetchR3Depth()])
      .then(([b, p, r]) => {
        setBiradicals(b.biradicals || []);
        setPositions(p.positions   || []);
        setDepths(r.depths         || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const tab = active => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    color: active ? '#fff' : '#444',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  });

  const counts = biradicals.length;
  const totalRoots = biradicals.reduce((s, d) => s + d.root_count, 0);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, flexWrap: 'wrap', rowGap: 8 }}>
        <span style={{ color: '#333', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Arabic Morphology</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CHARTS.map(c => (
            <button key={c.id} style={tab(chart === c.id)} onClick={() => setChart(c.id)}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* stats bar */}
      {counts > 0 && (
        <div style={{ display: 'flex', gap: 20, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, flexWrap: 'wrap' }}>
          <Stat label="bi-radical families"  value={counts}                                                color="#eab308" />
          <Stat label="of 1,024 possible"    value={`${((counts / 1024) * 100).toFixed(0)}%`}             color="#22c55e" />
          <Stat label="unmapped pairs"        value={(1024 - counts).toLocaleString()}                     color="#444" />
          <Stat label="total roots"           value={totalRoots.toLocaleString()}                          color="#a855f7" />
          <Stat label="r3 depth records"      value={depths.length.toLocaleString()}                       color="#3b82f6" />
          <Stat label="max r3 completions"    value={depths[0]?.r3_count ?? '—'}                           color="#f97316" />
        </div>
      )}

      {/* chart area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {loading && <Centered><span style={{ color: '#333' }}>loading…</span></Centered>}
        {error   && <Centered><span style={{ color: '#ef4444' }}>{error}</span></Centered>}
        {!loading && !error && chart === 1 && <ScatterChart  data={biradicals} />}
        {!loading && !error && chart === 2 && <Heatmap       data={biradicals} />}
        {!loading && !error && chart === 3 && <EcologyChart  data={positions} />}
        {!loading && !error && chart === 4 && <Scatter3D     data={biradicals} />}
        {!loading && !error && chart === 5 && <DepthMap      biradicals={biradicals} depths={depths} />}
        {!loading && !error && chart === 6 && <NetworkGraph  data={biradicals} />}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ color, fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{value}</span>
      <span style={{ color: '#333', fontSize: 11 }}>{label}</span>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  );
}
