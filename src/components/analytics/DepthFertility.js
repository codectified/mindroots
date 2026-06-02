import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PHON_CLASSES, CLASS_META } from './phonology';
import { useSize } from './shared';

// Depth × Fertility Scatter
//
// x = total_words (lexical fertility) — log scale
// y = r3_count   (structural depth)   — linear (max ~28)
// size = root_count
// color = total_corpus (gravity, log scale → purple gradient)
//
// Quadrant labels:
//   High fertility + high depth  → "generative engines"
//   High fertility + low depth   → "narrow producers"  (many words, few patterns)
//   Low fertility + high depth   → "exploratory cores" (few words, many r3 paths)
//   Low fertility + low depth    → "sprouts"
//
// Key insight: depth and fertility are not the same thing.
// A family can be lexically wide but structurally shallow, or structurally
// deep while remaining lexically contained. The outliers in each quadrant
// are the most structurally interesting families.

export default function DepthFertility({ biradicals, depths }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);

  const m = { top: 40, right: 40, bottom: 60, left: 60 };

  const { joined, xScale, yScale, rScale } = useMemo(() => {
    const depthMap = {};
    depths.forEach(d => { depthMap[d.pair_key] = d.r3_count; });

    const j = biradicals
      .filter(d => d.total_words > 0 && depthMap[d.pair_key] != null)
      .map(d => ({ ...d, r3_count: depthMap[d.pair_key] }));

    const xs = d3.scaleLog()
      .domain([1, d3.max(j, d => d.total_words) || 1])
      .range([m.left, w - m.right]).nice();

    const ys = d3.scaleLinear()
      .domain([0, d3.max(j, d => d.r3_count) || 1])
      .range([h - m.bottom, m.top]).nice();

    const rs = d3.scaleSqrt()
      .domain([0, d3.max(j, d => d.root_count) || 1])
      .range([3, 16]);

    return { joined: j, xScale: xs, yScale: ys, rScale: rs };
  }, [biradicals, depths, w, h]); // eslint-disable-line

  const outliers = useMemo(() => {
    const byDepth    = [...joined].sort((a, b) => b.r3_count - a.r3_count).slice(0, 5);
    const byFertile  = [...joined].sort((a, b) => b.total_words - a.total_words).slice(0, 5);
    const byBoth     = [...joined].sort((a, b) => (b.r3_count * b.total_words) - (a.r3_count * a.total_words)).slice(0, 4);
    return new Set([...byDepth, ...byFertile, ...byBoth].map(d => d.pair_key));
  }, [joined]);

  const xMid = Math.sqrt(xScale.domain()[0] * xScale.domain()[1]);
  const yMid = (yScale.domain()[0] + yScale.domain()[1]) / 2;

  const quadrants = [
    { label: 'generative engines',  x: xMid * 5,   y: yMid * 1.5 },
    { label: 'narrow producers',    x: xMid * 5,   y: yMid * 0.3 },
    { label: 'exploratory cores',   x: xMid * 0.2, y: yMid * 1.5 },
    { label: 'sprouts',             x: xMid * 0.2, y: yMid * 0.3 },
  ];

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {/* quadrant lines */}
        <line x1={xScale(xMid)} y1={m.top} x2={xScale(xMid)} y2={h - m.bottom} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
        <line x1={m.left} y1={yScale(yMid)} x2={w - m.right} y2={yScale(yMid)} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

        {/* quadrant labels */}
        {quadrants.map(q => {
          const px = Math.max(m.left + 10, Math.min(w - m.right - 10, xScale(q.x)));
          const py = Math.max(m.top + 10, Math.min(h - m.bottom - 10, yScale(q.y)));
          return <text key={q.label} x={px} y={py} textAnchor="middle" fill="rgba(255,255,255,0.07)" fontSize={10} fontStyle="italic">{q.label}</text>;
        })}

        {/* x axis */}
        {xScale.ticks(6).map(t => (
          <g key={t} transform={`translate(${xScale(t)},${h - m.bottom})`}>
            <line y2={5} stroke="rgba(255,255,255,0.15)" />
            <text y={17} textAnchor="middle" fill="#444" fontSize={10}>{d3.format('~s')(t)}</text>
          </g>
        ))}
        <text x={(m.left + w - m.right) / 2} y={h - 8} textAnchor="middle" fill="#444" fontSize={11}>lexical fertility (words, log scale)</text>

        {/* y axis */}
        {yScale.ticks(6).map(t => (
          <g key={t} transform={`translate(${m.left},${yScale(t)})`}>
            <line x2={-5} stroke="rgba(255,255,255,0.15)" />
            <text x={-10} dy="0.35em" textAnchor="end" fill="#444" fontSize={10}>{t}</text>
          </g>
        ))}
        <text transform={`translate(14,${(m.top + h - m.bottom) / 2}) rotate(-90)`} textAnchor="middle" fill="#444" fontSize={11}>structural depth (r3 completions)</text>

        {/* dots */}
        {joined.map(d => {
          const cx = xScale(d.total_words);
          const cy = yScale(d.r3_count);
          const r  = rScale(d.root_count);
          const isOut = outliers.has(d.pair_key);
          const isHov = hovered?.pair_key === d.pair_key;
          const col   = PHON_CLASSES[d.pair_key.split('-')[0]]?.color || '#666';
          return (
            <g key={d.pair_key}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}>
              <circle cx={cx} cy={cy} r={r}
                fill={isHov ? '#fff' : col}
                stroke={isOut ? '#fff' : 'none'}
                strokeWidth={1.5}
                opacity={isHov ? 1 : 0.65}
              />
              {isOut && (
                <text x={cx} y={cy - r - 4} textAnchor="middle"
                  fill="#eab308" fontSize={10} style={{ fontFamily: 'serif', direction: 'rtl' }}>
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
          position: 'absolute', top: 16, right: 16, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.75,
        }}>
          <div style={{ fontSize: 20, fontFamily: 'serif', color: PHON_CLASSES[hovered.pair_key.split('-')[0]]?.color || '#a855f7', marginBottom: 4 }}>{hovered.pair_key}</div>
          <div style={{ color: '#444', fontSize: 10, marginBottom: 4 }}>{PHON_CLASSES[hovered.pair_key.split('-')[0]]?.class} r1 · {PHON_CLASSES[hovered.pair_key.split('-')[1]]?.class} r2</div>
          <div style={{ color: '#aaa' }}>words: <span style={{ color: '#22c55e' }}>{hovered.total_words.toLocaleString()}</span></div>
          <div style={{ color: '#aaa' }}>r3 depth: <span style={{ color: '#a855f7', fontWeight: 700 }}>{hovered.r3_count}</span><span style={{ color: '#444' }}> / 28</span></div>
          <div style={{ color: '#aaa' }}>roots: <span style={{ color: '#fff' }}>{hovered.root_count}</span></div>
          <div style={{ color: '#aaa' }}>corpus: <span style={{ color: '#ef4444' }}>{hovered.total_corpus.toLocaleString()}</span></div>
        </div>
      )}

      {/* class legend */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Object.entries(CLASS_META).map(([cls, meta]) => (
          <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: meta.color }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />
            {meta.label} <span style={{ color: '#333', fontSize: 9 }}>(r1)</span>
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#555', marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #fff', display: 'inline-block', flexShrink: 0 }} />
          outlier
        </span>
      </div>
    </div>
  );
}
