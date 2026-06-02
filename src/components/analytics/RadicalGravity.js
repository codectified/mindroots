import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PHON_CLASSES, CLASS_META } from './phonology';
import { useSize } from './shared';

// Radical Gravity
//
// For each Arabic radical, two independent properties:
//
//   x = r1 preference = r1_corpus / (r1_corpus + r2_corpus)
//       0.5 = neutral (equally productive in both positions)
//       > 0.5 = initiator (more productive as r1)
//       < 0.5 = follower (more productive as r2)
//
//   y = r1 corpus weight = total corpus occurrences in families where
//       this radical appears as r1 (log scale)
//       Measures the absolute "gravity" of this radical as a root anchor.
//
//   size = count of distinct roots this radical initiates (r1 root count)
//   color = phonological class
//
// The top-right quadrant = PRIMARY ANCHORS:
//   consonants that are both heavy (large r1 corpus presence) AND
//   strongly prefer r1 position. These are the morphological load-bearers —
//   the consonants whose families dominate the corpus and who consistently
//   appear first in roots.
//
// Language acquisition note: high-frequency, morphologically central vocabulary
// is acquired earlier across all languages. If the primary anchors cluster in
// specific phonological classes, it would suggest those classes are acquired
// first because they appear in the highest-frequency words — not for
// articulatory reasons alone, but for morphological-statistical ones.

const METRICS = [
  { key: 'corpus', label: 'corpus weight' },
  { key: 'words',  label: 'word count'    },
  { key: 'roots',  label: 'root count'    },
];

export default function RadicalGravity({ positions, biradicals }) {
  const wrapRef  = useRef();
  const { w, h } = useSize(wrapRef);
  const [metric,  setMetric]  = useState('corpus');
  const [hovered, setHovered] = useState(null);

  // Aggregate positions data per radical
  const radicals = useMemo(() => {
    const map = {};
    positions.forEach(p => {
      if (!map[p.radical]) map[p.radical] = { r1_corpus: 0, r2_corpus: 0, r3_corpus: 0, r1_roots: 0, r2_roots: 0, r3_roots: 0, r1_words: 0, r2_words: 0, r3_words: 0 };
      const e = map[p.radical];
      if (p.position === 'r1') { e.r1_corpus = p.corpus; e.r1_roots = p.roots; e.r1_words = p.words; }
      if (p.position === 'r2') { e.r2_corpus = p.corpus; e.r2_roots = p.roots; e.r2_words = p.words; }
      if (p.position === 'r3') { e.r3_corpus = p.corpus; e.r3_roots = p.roots; e.r3_words = p.words; }
    });

    return Object.entries(map).map(([rad, e]) => {
      const r1v = metric === 'corpus' ? e.r1_corpus : metric === 'words' ? e.r1_words : e.r1_roots;
      const r2v = metric === 'corpus' ? e.r2_corpus : metric === 'words' ? e.r2_words : e.r2_roots;
      const r1Share = (r1v + r2v) > 0 ? r1v / (r1v + r2v) : 0.5;
      const totalAll = e.r1_corpus + e.r2_corpus + e.r3_corpus;
      return {
        rad, ...e,
        r1v, r2v, r1Share,
        totalAll,
        cls:   PHON_CLASSES[rad]?.class   || 'Unknown',
        color: PHON_CLASSES[rad]?.color   || '#666',
      };
    }).filter(d => d.r1v > 0 || d.r2v > 0);
  }, [positions, metric]);

  // Compute pair-level directionality tendency per radical (avg asymmetry toward r1)
  const radAsym = useMemo(() => {
    const biMap = {};
    biradicals.forEach(d => { biMap[d.pair_key] = d; });
    const seen = new Set();
    const asymMap = {};
    biradicals.forEach(d => {
      const [r1, r2] = d.pair_key.split('-');
      const revKey = `${r2}-${r1}`;
      if (seen.has(d.pair_key) || seen.has(revKey)) return;
      const rev = biMap[revKey];
      if (!rev) return;
      seen.add(d.pair_key); seen.add(revKey);
      const fv = metric === 'corpus' ? d.total_corpus : metric === 'words' ? d.total_words : d.root_count;
      const rv = metric === 'corpus' ? rev.total_corpus : metric === 'words' ? rev.total_words : rev.root_count;
      const asym = (fv + rv) > 0 ? (fv - rv) / (fv + rv) : 0;
      if (!asymMap[r1]) asymMap[r1] = [];
      if (!asymMap[r2]) asymMap[r2] = [];
      asymMap[r1].push(asym);
      asymMap[r2].push(-asym);
    });
    const result = {};
    Object.entries(asymMap).forEach(([rad, vals]) => {
      result[rad] = vals.reduce((s, v) => s + v, 0) / vals.length;
    });
    return result;
  }, [biradicals, metric]);

  const m = { top: 40, right: 30, bottom: 60, left: 65 };
  const iw = Math.max(1, w - m.left - m.right);
  const ih = Math.max(1, h - m.top - m.bottom - 60); // 60 for controls

  const maxR1v  = d3.max(radicals, d => d.r1v) || 1;
  const xScale  = d3.scaleLinear([0, 1],       [m.left, m.left + iw]);
  const yScale  = d3.scaleLog([1, maxR1v],     [m.top + ih, m.top]).nice();
  const rScale  = d3.scaleSqrt([0, d3.max(radicals, d => d.r1_roots) || 1], [4, 18]);

  // Quadrant midpoints for labels
  const xMid = xScale(0.5);
  const yMid = (m.top + m.top + ih) / 2;

  const quadrantLabels = [
    { x: xScale(0.75), y: m.top + 14, label: 'primary anchors', desc: 'heavy + prefers r1' },
    { x: xScale(0.75), y: m.top + ih - 6, label: 'specialist initiators', desc: 'prefers r1, lighter' },
    { x: xScale(0.25), y: m.top + 14, label: 'contested heavyweights', desc: 'heavy, split r1/r2' },
    { x: xScale(0.25), y: m.top + ih - 6, label: 'followers', desc: 'lighter, prefers r2' },
  ];

  const metricLabel = metric === 'corpus' ? 'corpus occurrences' : metric === 'words' ? 'word count' : 'root count';

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Controls */}
      <div style={{ padding: '8px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#444', fontSize: 11 }}>y-axis / dominance metric:</span>
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)} style={{
            padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
            background: metric === m.key ? 'rgba(234,179,8,0.15)' : 'transparent',
            border: `1px solid ${metric === m.key ? '#eab308' : 'rgba(255,255,255,0.07)'}`,
            color: metric === m.key ? '#eab308' : '#555',
          }}>{m.label}</button>
        ))}
      </div>

      {/* Class legend */}
      <div style={{ padding: '4px 14px', flexShrink: 0, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(CLASS_META).map(([cls, meta]) => (
          <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: meta.color }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
            {meta.label}
          </span>
        ))}
        <span style={{ color: '#333', fontSize: 10 }}>size = r1 roots initiated · border = directionality asymmetry</span>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {w > 0 && h > 0 && (
          <svg width={w} height={h - 60} style={{ display: 'block' }}>

            {/* Quadrant dividers */}
            <line x1={xMid} y1={m.top} x2={xMid} y2={m.top + ih}
              stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <line x1={m.left} y1={yMid} x2={m.left + iw} y2={yMid}
              stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

            {/* Quadrant labels */}
            {quadrantLabels.map(q => (
              <text key={q.label} x={q.x} y={q.y} textAnchor="middle"
                fill="rgba(255,255,255,0.07)" fontSize={10} fontStyle="italic">{q.label}</text>
            ))}

            {/* x axis */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => (
              <g key={t} transform={`translate(${xScale(t)},${m.top + ih})`}>
                <line y2={5} stroke="rgba(255,255,255,0.12)" />
                <text y={16} textAnchor="middle" fill="#444" fontSize={9}>
                  {t === 0 ? '← pure r2' : t === 0.5 ? 'neutral' : t === 1 ? 'pure r1 →' : `${Math.round(t * 100)}%`}
                </text>
              </g>
            ))}
            <text x={m.left + iw / 2} y={m.top + ih + 34}
              textAnchor="middle" fill="#444" fontSize={11}>r1 preference  (r1 {metricLabel} share vs r2)</text>

            {/* y axis */}
            {yScale.ticks(5).map(t => (
              <g key={t} transform={`translate(${m.left},${yScale(t)})`}>
                <line x2={-5} stroke="rgba(255,255,255,0.12)" />
                <text x={-8} dy="0.35em" textAnchor="end" fill="#444" fontSize={9}>{d3.format('~s')(t)}</text>
              </g>
            ))}
            <text transform={`translate(14,${m.top + ih / 2}) rotate(-90)`}
              textAnchor="middle" fill="#444" fontSize={11}>r1 {metricLabel} (log scale)</text>

            {/* Dots */}
            {radicals.map(d => {
              const cx = xScale(d.r1Share);
              const cy = yScale(Math.max(1, d.r1v));
              const r  = rScale(d.r1_roots);
              const isHov = hovered?.rad === d.rad;
              const asymScore = radAsym[d.rad] || 0;
              const strokeW = Math.abs(asymScore) * 3;
              const strokeCol = asymScore > 0 ? '#22c55e' : '#ef4444';
              return (
                <g key={d.rad}
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'default' }}>
                  <circle cx={cx} cy={cy} r={r + 4} fill="transparent" />
                  <circle cx={cx} cy={cy} r={r}
                    fill={isHov ? '#fff' : d.color}
                    fillOpacity={isHov ? 1 : 0.75}
                    stroke={Math.abs(asymScore) > 0.05 ? strokeCol : 'none'}
                    strokeWidth={strokeW}
                    strokeOpacity={0.7}
                  />
                  <text x={cx} y={cy + r + 11}
                    textAnchor="middle"
                    fill={isHov ? '#fff' : d.color}
                    fontSize={isHov ? 14 : 12}
                    fontFamily="serif"
                    fontWeight={isHov ? 700 : 500}>
                    {d.rad}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Tooltip */}
        {hovered && (
          <div style={{
            position: 'absolute', top: 8, right: 8, pointerEvents: 'none',
            background: 'rgba(0,0,0,0.93)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8, padding: '10px 14px', fontSize: 12, lineHeight: 1.8, maxWidth: 240,
          }}>
            <div style={{ fontSize: 28, fontFamily: 'serif', color: hovered.color, marginBottom: 2 }}>{hovered.rad}</div>
            <div style={{ color: '#444', fontSize: 10, marginBottom: 6 }}>{hovered.cls}</div>
            <div style={{ color: '#555' }}>r1 preference: <span style={{ color: hovered.r1Share > 0.5 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{Math.round(hovered.r1Share * 100)}%</span></div>
            <div style={{ color: '#555' }}>r1 corpus: <span style={{ color: '#eab308' }}>{hovered.r1_corpus.toLocaleString()}</span></div>
            <div style={{ color: '#555' }}>r2 corpus: <span style={{ color: '#555' }}>{hovered.r2_corpus.toLocaleString()}</span></div>
            <div style={{ color: '#555' }}>r1 roots: <span style={{ color: '#a855f7' }}>{hovered.r1_roots}</span></div>
            <div style={{ color: '#555' }}>r1 words: <span style={{ color: '#22c55e' }}>{hovered.r1_words.toLocaleString()}</span></div>
            <div style={{ color: '#555' }}>directionality: <span style={{
              color: (radAsym[hovered.rad] || 0) > 0.05 ? '#22c55e' : (radAsym[hovered.rad] || 0) < -0.05 ? '#ef4444' : '#555',
            }}>{((radAsym[hovered.rad] || 0) * 100).toFixed(1)}% {(radAsym[hovered.rad] || 0) > 0.05 ? 'initiator' : (radAsym[hovered.rad] || 0) < -0.05 ? 'follower' : 'neutral'}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
