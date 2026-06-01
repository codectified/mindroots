import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useSize } from './shared';

// Zipf Distribution of Bi-Radical Families by Corpus Gravity
//
// Sorts all 654 families by total_corpus descending and plots:
//   x = log(rank)   — position in the sorted list
//   y = log(corpus) — corpus gravity
//
// A straight line on log-log = power law (Zipfian distribution).
// Slope is computed via linear regression. Zipf's law for word
// frequencies predicts slope ≈ -1. A steeper slope means gravity
// is MORE concentrated (a few families dominate everything).
// A shallower slope means more even distribution.
//
// The "elbow" where the curve breaks from the line is the transition
// between dominant families and the long tail.

export default function ZipfChart({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);

  const m = { top: 40, right: 120, bottom: 60, left: 70 };

  const { sorted, slope, intercept, r2, xScale, yScale, topN } = useMemo(() => {
    const s = [...data]
      .filter(d => d.total_corpus > 0)
      .sort((a, b) => b.total_corpus - a.total_corpus)
      .map((d, i) => ({ ...d, rank: i + 1 }));

    // Linear regression on log(rank) vs log(corpus)
    const xs = s.map(d => Math.log10(d.rank));
    const ys = s.map(d => Math.log10(d.total_corpus));
    const n  = s.length;
    const mx = xs.reduce((a, v) => a + v, 0) / n;
    const my = ys.reduce((a, v) => a + v, 0) / n;
    const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
    const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    const sl  = den > 0 ? num / den : 0;
    const ic  = my - sl * mx;

    // R²
    const ssTot = ys.reduce((a, y) => a + (y - my) ** 2, 0);
    const ssRes = ys.reduce((a, y, i) => a + (y - (sl * xs[i] + ic)) ** 2, 0);
    const r2Val = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    const xS = d3.scaleLog().domain([1, s.length]).range([m.left, w - m.right]).nice();
    const yS = d3.scaleLog()
      .domain([Math.max(1, d3.min(s, d => d.total_corpus)), d3.max(s, d => d.total_corpus)])
      .range([h - m.bottom, m.top]).nice();

    return { sorted: s, slope: sl, intercept: ic, r2: r2Val, xScale: xS, yScale: yS, topN: s.slice(0, 12) };
  }, [data, w, h]); // eslint-disable-line

  // Fit line endpoints
  const fitLine = xScale ? [
    { x: xScale.domain()[0], y: 10 ** (slope * Math.log10(xScale.domain()[0]) + intercept) },
    { x: xScale.domain()[1], y: 10 ** (slope * Math.log10(xScale.domain()[1]) + intercept) },
  ] : [];

  const topKeys = new Set(topN.map(d => d.pair_key));

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {/* regression line */}
        {fitLine.length === 2 && (
          <line
            x1={xScale(fitLine[0].x)} y1={yScale(Math.max(yScale.domain()[0], fitLine[0].y))}
            x2={xScale(fitLine[1].x)} y2={yScale(Math.max(yScale.domain()[0], fitLine[1].y))}
            stroke="rgba(234,179,8,0.25)" strokeWidth={1.5} strokeDasharray="6 4"
          />
        )}

        {/* x axis */}
        {xScale && xScale.ticks(6).map(t => (
          <g key={t} transform={`translate(${xScale(t)},${h - m.bottom})`}>
            <line y2={5} stroke="rgba(255,255,255,0.15)" />
            <text y={17} textAnchor="middle" fill="#444" fontSize={10}>{t}</text>
          </g>
        ))}
        <text x={(m.left + w - m.right) / 2} y={h - 8} textAnchor="middle" fill="#444" fontSize={11}>rank (log scale)</text>

        {/* y axis */}
        {yScale && yScale.ticks(5).map(t => (
          <g key={t} transform={`translate(${m.left},${yScale(t)})`}>
            <line x2={-5} stroke="rgba(255,255,255,0.15)" />
            <text x={-10} dy="0.35em" textAnchor="end" fill="#444" fontSize={10}>{d3.format('~s')(t)}</text>
          </g>
        ))}
        <text transform={`translate(14,${(m.top + h - m.bottom) / 2}) rotate(-90)`} textAnchor="middle" fill="#444" fontSize={11}>corpus gravity (log scale)</text>

        {/* dots */}
        {xScale && yScale && sorted.map(d => {
          const cx   = xScale(d.rank);
          const rawY = d.total_corpus;
          if (rawY < yScale.domain()[0]) return null;
          const cy   = yScale(rawY);
          const isTop = topKeys.has(d.pair_key);
          const isHov = hovered?.pair_key === d.pair_key;
          return (
            <g key={d.pair_key}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}>
              <circle cx={cx} cy={cy} r={isTop ? 5 : 3}
                fill={isHov ? '#fff' : isTop ? '#ef4444' : 'rgba(168,85,247,0.6)'}
                stroke={isTop ? '#ef4444' : 'none'} strokeWidth={1}
              />
              {isTop && (
                <text x={cx + 7} y={cy + 3} fill="#ef4444" fontSize={10} style={{ fontFamily: 'serif', direction: 'rtl' }}>{d.pair_key}</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* stats panel */}
      <div style={{
        position: 'absolute', top: 12, right: 16,
        background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12, lineHeight: 1.9, minWidth: 100,
      }}>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>power law fit</div>
        <div style={{ color: '#aaa' }}>slope: <span style={{ color: '#eab308', fontWeight: 700 }}>{slope.toFixed(2)}</span></div>
        <div style={{ color: '#aaa' }}>R²: <span style={{ color: '#22c55e', fontWeight: 700 }}>{(r2 * 100).toFixed(0)}%</span></div>
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1a1a1a', color: '#555', fontSize: 10, lineHeight: 1.6 }}>
          Zipf law: slope = −1<br />
          {Math.abs(slope) > 1.1 ? 'steeper → more concentrated' : Math.abs(slope) < 0.9 ? 'shallower → more even' : 'near Zipfian'}
        </div>
      </div>

      {/* hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 56, left: 16, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.75,
        }}>
          <div style={{ fontSize: 18, fontFamily: 'serif', color: '#a855f7', marginBottom: 4 }}>{hovered.pair_key}</div>
          <div style={{ color: '#aaa' }}>rank: <span style={{ color: '#fff' }}>#{hovered.rank}</span></div>
          <div style={{ color: '#aaa' }}>corpus: <span style={{ color: '#ef4444' }}>{hovered.total_corpus.toLocaleString()}</span></div>
          <div style={{ color: '#aaa' }}>words: <span style={{ color: '#22c55e' }}>{hovered.total_words.toLocaleString()}</span></div>
        </div>
      )}
    </div>
  );
}
