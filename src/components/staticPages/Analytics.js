import { useEffect, useState, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { fetchBiradicals, fetchRadicalPositions } from '../../services/apiService';

// ─── helpers ────────────────────────────────────────────────────────────────

const DARK = '#0a0a0f';
const PANEL = { background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 14px' };

function useSize(ref) {
  const [size, setSize] = useState({ w: 800, h: 500 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

// ─── Chart 1 · Fertility vs Gravity ─────────────────────────────────────────

function ScatterChart({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);

  const m = { top: 40, right: 40, bottom: 60, left: 70 };

  const filtered = useMemo(() => data.filter(d => d.total_words > 0 && d.total_corpus > 0), [data]);

  const xScale = useMemo(() => d3.scaleLog()
    .domain([1, d3.max(filtered, d => d.total_words) || 1])
    .range([m.left, w - m.right]).nice(), [filtered, w]);

  const yScale = useMemo(() => d3.scaleLog()
    .domain([1, d3.max(filtered, d => d.total_corpus) || 1])
    .range([h - m.bottom, m.top]).nice(), [filtered, h]);

  const rScale = useMemo(() => d3.scaleSqrt()
    .domain([0, d3.max(filtered, d => d.root_count) || 1])
    .range([3, 18]), [filtered]);

  // label the most interesting outliers: top by corpus, top by words, top by ratio
  const outliers = useMemo(() => {
    const byCorpus = [...filtered].sort((a, b) => b.total_corpus - a.total_corpus).slice(0, 6);
    const byWords  = [...filtered].sort((a, b) => b.total_words  - a.total_words).slice(0, 6);
    const byRatio  = [...filtered]
      .map(d => ({ ...d, ratio: d.total_corpus / Math.max(d.total_words, 1) }))
      .sort((a, b) => b.ratio - a.ratio).slice(0, 6);
    const keys = new Set([...byCorpus, ...byWords, ...byRatio].map(d => d.pair_key));
    return new Set(keys);
  }, [filtered]);

  // quadrant midpoints (geometric mean for log scale)
  const xMid = Math.sqrt(xScale.domain()[0] * xScale.domain()[1]);
  const yMid = Math.sqrt(yScale.domain()[0] * yScale.domain()[1]);

  const quadrants = [
    { label: 'civilizations',    x: xMid * 8,  y: yMid * 8,  anchor: 'middle' },
    { label: 'word factories',   x: xMid * 8,  y: yMid * 0.1, anchor: 'middle' },
    { label: 'sacred cores',     x: xMid * 0.1, y: yMid * 8, anchor: 'middle' },
    { label: 'quiet provinces',  x: xMid * 0.1, y: yMid * 0.1, anchor: 'middle' },
  ];

  // x-axis ticks
  const xTicks = xScale.ticks(6);
  const yTicks = yScale.ticks(6);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {/* quadrant dividers */}
        <line x1={xScale(xMid)} y1={m.top} x2={xScale(xMid)} y2={h - m.bottom} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
        <line x1={m.left} y1={yScale(yMid)} x2={w - m.right} y2={yScale(yMid)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

        {/* quadrant labels */}
        {quadrants.map(q => {
          const px = xScale(Math.max(xScale.domain()[0], Math.min(xScale.domain()[1], q.x)));
          const py = yScale(Math.max(yScale.domain()[0], Math.min(yScale.domain()[1], q.y)));
          return (
            <text key={q.label} x={px} y={py} textAnchor={q.anchor}
              fill="rgba(255,255,255,0.1)" fontSize={11} fontStyle="italic">
              {q.label}
            </text>
          );
        })}

        {/* x axis */}
        {xTicks.map(t => (
          <g key={t} transform={`translate(${xScale(t)},${h - m.bottom})`}>
            <line y2={5} stroke="rgba(255,255,255,0.2)" />
            <text y={18} textAnchor="middle" fill="#666" fontSize={10}>{d3.format('~s')(t)}</text>
          </g>
        ))}
        <text x={(m.left + w - m.right) / 2} y={h - 10} textAnchor="middle" fill="#555" fontSize={12}>
          lexical fertility (words)
        </text>

        {/* y axis */}
        {yTicks.map(t => (
          <g key={t} transform={`translate(${m.left},${yScale(t)})`}>
            <line x2={-5} stroke="rgba(255,255,255,0.2)" />
            <text x={-10} dy="0.35em" textAnchor="end" fill="#666" fontSize={10}>{d3.format('~s')(t)}</text>
          </g>
        ))}
        <text transform={`translate(16,${(m.top + h - m.bottom) / 2}) rotate(-90)`} textAnchor="middle" fill="#555" fontSize={12}>
          corpus gravity (occurrences)
        </text>

        {/* dots */}
        {filtered.map(d => {
          const cx = xScale(d.total_words);
          const cy = yScale(d.total_corpus);
          const r  = rScale(d.root_count);
          const isOutlier = outliers.has(d.pair_key);
          const isHov = hovered?.pair_key === d.pair_key;
          return (
            <g key={d.pair_key}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}>
              <circle cx={cx} cy={cy} r={r}
                fill={isHov ? '#fff' : isOutlier ? '#eab308' : 'rgba(34,197,94,0.6)'}
                stroke={isHov ? '#fff' : isOutlier ? '#eab308' : 'none'}
                strokeWidth={1}
              />
              {isOutlier && (
                <text x={cx} y={cy - r - 4} textAnchor="middle" fill="#eab308" fontSize={11}
                  style={{ fontFamily: 'serif', direction: 'rtl' }}>
                  {d.pair_key}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 20, fontFamily: 'serif', direction: 'rtl', color: '#eab308', marginBottom: 4 }}>
            {hovered.pair_key}
          </div>
          <div style={{ color: '#aaa' }}>roots: <span style={{ color: '#fff' }}>{hovered.root_count}</span></div>
          <div style={{ color: '#aaa' }}>words: <span style={{ color: '#22c55e' }}>{hovered.total_words.toLocaleString()}</span></div>
          <div style={{ color: '#aaa' }}>corpus: <span style={{ color: '#ef4444' }}>{hovered.total_corpus.toLocaleString()}</span></div>
          <div style={{ color: '#aaa' }}>gravity/word: <span style={{ color: '#a855f7' }}>
            {(hovered.total_corpus / Math.max(hovered.total_words, 1)).toFixed(1)}×
          </span></div>
        </div>
      )}
    </div>
  );
}

// ─── Chart 2 · Bi-Radical Heatmap ───────────────────────────────────────────

function Heatmap({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);

  const { radicals, matrix, colorScale } = useMemo(() => {
    // extract unique r1 / r2 from pair_key (format: "X-Y")
    const r1set = new Set(), r2set = new Set();
    data.forEach(d => {
      const [a, b] = d.pair_key.split('-');
      if (a) r1set.add(a);
      if (b) r2set.add(b);
    });
    // use union sorted; rows = r1, cols = r2
    const allR = [...new Set([...r1set, ...r2set])].sort();
    const map = {};
    data.forEach(d => { map[d.pair_key] = d; });

    const color = d3.scaleSequential(d3.interpolate('#111827', '#eab308'))
      .domain([0, d3.max(data, d => d.root_count) || 1]);

    return { radicals: allR, matrix: map, colorScale: color };
  }, [data]);

  const n = radicals.length;
  const labelPad = 28;
  const cellSize = Math.min(Math.floor((Math.min(w, h) - labelPad * 2) / n), 22);
  const gridW = cellSize * n;
  const gridH = cellSize * n;
  const offsetX = (w - gridW - labelPad) / 2 + labelPad;
  const offsetY = (h - gridH - labelPad) / 2 + labelPad;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {/* column labels (r2) */}
        {radicals.map((rad, ci) => (
          <text key={`col-${rad}`}
            x={offsetX + ci * cellSize + cellSize / 2}
            y={offsetY - 6}
            textAnchor="middle" fill="#666" fontSize={Math.min(cellSize - 2, 11)}
            style={{ fontFamily: 'serif', direction: 'rtl' }}>
            {rad}
          </text>
        ))}

        {/* row labels (r1) */}
        {radicals.map((rad, ri) => (
          <text key={`row-${rad}`}
            x={offsetX - 6}
            y={offsetY + ri * cellSize + cellSize / 2}
            textAnchor="end" dominantBaseline="middle" fill="#666"
            fontSize={Math.min(cellSize - 2, 11)}
            style={{ fontFamily: 'serif', direction: 'rtl' }}>
            {rad}
          </text>
        ))}

        {/* cells */}
        {radicals.map((r1, ri) =>
          radicals.map((r2, ci) => {
            const key = `${r1}-${r2}`;
            const d   = matrix[key];
            const isHov = hovered?.pair_key === key;
            return (
              <rect key={key}
                x={offsetX + ci * cellSize}
                y={offsetY + ri * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={d ? colorScale(d.root_count) : '#111827'}
                stroke={isHov ? '#fff' : 'none'}
                strokeWidth={1.5}
                onMouseEnter={() => setHovered(d ? { ...d, pair_key: key } : { pair_key: key, empty: true })}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: d ? 'default' : 'default' }}
              />
            );
          })
        )}
      </svg>

      {hovered && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 20, fontFamily: 'serif', direction: 'rtl', color: '#eab308', marginBottom: 4 }}>
            {hovered.pair_key}
          </div>
          {hovered.empty ? (
            <div style={{ color: '#555', fontStyle: 'italic' }}>unmapped — measurable absence</div>
          ) : (
            <>
              <div style={{ color: '#aaa' }}>roots: <span style={{ color: '#fff' }}>{hovered.root_count}</span></div>
              <div style={{ color: '#aaa' }}>words: <span style={{ color: '#22c55e' }}>{hovered.total_words?.toLocaleString()}</span></div>
              <div style={{ color: '#aaa' }}>corpus: <span style={{ color: '#ef4444' }}>{hovered.total_corpus?.toLocaleString()}</span></div>
            </>
          )}
        </div>
      )}

      {/* color legend */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#555', fontSize: 11 }}>0</span>
        <svg width={120} height={12}>
          <defs>
            <linearGradient id="hm-grad">
              <stop offset="0%"   stopColor="#111827" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          <rect width={120} height={12} rx={3} fill="url(#hm-grad)" />
        </svg>
        <span style={{ color: '#555', fontSize: 11 }}>roots</span>
      </div>
    </div>
  );
}

// ─── Chart 3 · Radical Position Ecology ─────────────────────────────────────

const POSITION_COLORS = { r1: '#22c55e', r2: '#3b82f6', r3: '#a855f7' };
const METRICS = [
  { key: 'roots',  label: 'roots' },
  { key: 'words',  label: 'words' },
  { key: 'corpus', label: 'corpus gravity' },
];

function EcologyChart({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [metric, setMetric] = useState('roots');
  const [hovered, setHovered] = useState(null);

  // group by radical
  const { radicals, grouped, xScale } = useMemo(() => {
    const g = {};
    data.forEach(d => {
      if (!g[d.radical]) g[d.radical] = { r1: 0, r2: 0, r3: 0 };
      g[d.radical][d.position] = d[metric];
    });
    const rads = Object.keys(g).sort();
    const maxVal = d3.max(rads, rad => Math.max(g[rad].r1, g[rad].r2, g[rad].r3)) || 1;
    const xs = d3.scaleLinear().domain([0, maxVal]).range([0, 1]); // normalized 0-1
    return { radicals: rads, grouped: g, xScale: xs };
  }, [data, metric]);

  const m = { top: 8, right: 16, bottom: 8, left: 36 };
  const rowH = Math.max(14, Math.min(24, Math.floor((h - m.top - m.bottom) / (radicals.length || 1))));
  const barH = Math.floor(rowH * 0.28);
  const barGap = 2;
  const maxBarW = w - m.left - m.right;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* metric toggle */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', flexShrink: 0 }}>
        {METRICS.map(m2 => (
          <button key={m2.key} onClick={() => setMetric(m2.key)} style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: metric === m2.key ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: metric === m2.key ? '#fff' : '#666',
          }}>
            {m2.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {['r1','r2','r3'].map(p => (
            <span key={p} style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: POSITION_COLORS[p], display: 'inline-block' }} />
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* chart area */}
      <div ref={wrapRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <svg width={w} height={Math.max(h, radicals.length * rowH + m.top + m.bottom)} style={{ display: 'block' }}>
          {radicals.map((rad, ri) => {
            const g   = grouped[rad];
            const y0  = m.top + ri * rowH;
            const isHov = hovered === rad;
            return (
              <g key={rad}
                onMouseEnter={() => setHovered(rad)}
                onMouseLeave={() => setHovered(null)}>
                {isHov && <rect x={0} y={y0} width={w} height={rowH} fill="rgba(255,255,255,0.03)" />}
                {/* radical label */}
                <text x={m.left - 4} y={y0 + rowH / 2} textAnchor="end" dominantBaseline="middle"
                  fill={isHov ? '#fff' : '#888'} fontSize={Math.min(rowH - 2, 13)}
                  style={{ fontFamily: 'serif', direction: 'rtl' }}>
                  {rad}
                </text>
                {/* three bars */}
                {['r1','r2','r3'].map((pos, pi) => {
                  const val = g[pos] || 0;
                  const bw  = xScale(val) * maxBarW;
                  const by  = y0 + (rowH - (barH * 3 + barGap * 2)) / 2 + pi * (barH + barGap);
                  return (
                    <rect key={pos} x={m.left} y={by} width={Math.max(1, bw)} height={barH}
                      fill={POSITION_COLORS[pos]} opacity={0.8} rx={1} />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {hovered && grouped[hovered] && (
          <div style={{
            position: 'absolute', top: 8, right: 24,
            background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 20, fontFamily: 'serif', color: '#eab308', marginBottom: 4 }}>{hovered}</div>
            {['r1','r2','r3'].map(p => (
              <div key={p} style={{ color: '#aaa' }}>
                {p}: <span style={{ color: POSITION_COLORS[p] }}>{(grouped[hovered][p] || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Analytics Page ─────────────────────────────────────────────────────

const CHARTS = [
  { id: 1, label: 'Fertility vs Gravity' },
  { id: 2, label: 'Bi-Radical Heatmap' },
  { id: 3, label: 'Position Ecology' },
];

export default function Analytics() {
  const [biradicals, setBiradicals] = useState([]);
  const [positions,  setPositions]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [chart,      setChart]      = useState(1);

  useEffect(() => {
    Promise.all([fetchBiradicals(), fetchRadicalPositions()])
      .then(([b, p]) => {
        setBiradicals(b.biradicals || []);
        setPositions(p.positions   || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const tabStyle = active => ({
    padding: '6px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    color: active ? '#fff' : '#555',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ width: '100%', height: '100%', background: DARK, display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <span style={{ color: '#555', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Arabic Morphology Analytics
        </span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {CHARTS.map(c => (
            <button key={c.id} style={tabStyle(chart === c.id)} onClick={() => setChart(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* stats bar */}
      {biradicals.length > 0 && (
        <div style={{ display: 'flex', gap: 24, padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <Stat label="bi-radical families" value={biradicals.length} color="#eab308" />
          <Stat label="of 1,024 possible" value={`${((biradicals.length / 1024) * 100).toFixed(0)}%`} color="#22c55e" />
          <Stat label="unmapped pairs" value={(1024 - biradicals.length).toLocaleString()} color="#555" />
          <Stat label="total roots" value={d3.sum(biradicals, d => d.root_count).toLocaleString()} color="#a855f7" />
        </div>
      )}

      {/* chart area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
            loading…
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            {error}
          </div>
        )}
        {!loading && !error && chart === 1 && <ScatterChart data={biradicals} />}
        {!loading && !error && chart === 2 && <Heatmap data={biradicals} />}
        {!loading && !error && chart === 3 && <EcologyChart data={positions} />}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ color, fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>{value}</span>
      <span style={{ color: '#444', fontSize: 11 }}>{label}</span>
    </div>
  );
}
