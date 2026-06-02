import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PHON_CLASSES } from './phonology';
import { useSize } from './shared';

// Ranked Corpus Distribution
//
// Shows the top bi-radical families sorted by corpus gravity (descending).
// The steep drop-off from left to right is the Zipf distribution in Arabic:
// a small number of root families dominate the vast majority of textual usage.
//
// This is not a statistical curiosity — it reflects real linguistic structure.
// The top families are the semantic cores of Classical Arabic: existence,
// knowledge, speech, movement, divine action. Everything else is periphery.
//
// Color = phonological class of r1 consonant.
// Toggle to log scale to see the power-law curve that underlies the distribution.

export default function ZipfChart({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);
  const [logScale, setLogScale] = useState(false);
  const [showN, setShowN] = useState(40);

  const sorted = useMemo(() =>
    [...data].filter(d => d.total_corpus > 0)
      .sort((a, b) => b.total_corpus - a.total_corpus)
      .slice(0, showN)
      .map((d, i) => ({
        ...d,
        rank: i + 1,
        r1: d.pair_key.split('-')[0],
        color: PHON_CLASSES[d.pair_key.split('-')[0]]?.color || '#666',
      })),
    [data, showN]);

  const top5corpus = useMemo(() => sorted.slice(0, 5).reduce((s, d) => s + d.total_corpus, 0), [sorted]);
  const totalCorpus = useMemo(() => data.reduce((s, d) => s + d.total_corpus, 0), [data]);
  const top5pct = totalCorpus > 0 ? ((top5corpus / totalCorpus) * 100).toFixed(0) : '—';

  const pad = { top: 12, right: 8, bottom: 48, left: 48 };
  const innerW = Math.max(0, w - pad.left - pad.right);
  const innerH = Math.max(0, h - pad.top - pad.bottom - 52); // 52 = stats strip + controls

  const maxCorpus = sorted.length ? sorted[0].total_corpus : 1;
  const xScale = useMemo(() => {
    if (!innerW || !sorted.length) return null;
    const domain = logScale
      ? [sorted[sorted.length - 1]?.total_corpus || 1, maxCorpus]
      : [0, maxCorpus];
    return logScale
      ? d3.scaleLog().domain(domain).range([0, innerW]).nice()
      : d3.scaleLinear().domain(domain).range([0, innerW]);
  }, [sorted, innerW, logScale, maxCorpus]);

  const barH = sorted.length ? Math.max(6, Math.min(20, Math.floor(innerH / sorted.length) - 1)) : 12;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* summary callout */}
      <div style={{ padding: '8px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 20, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ color: '#eab308', fontWeight: 700, fontSize: 14 }}>Top 5 = {top5pct}% of corpus</span>
        <span style={{ color: '#333', fontSize: 11 }}>The most-used root families dominate usage by orders of magnitude. Everything else is the long tail.</span>
      </div>

      {/* controls */}
      <div style={{ display: 'flex', gap: 8, padding: '6px 14px', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#444', fontSize: 11 }}>show top:</span>
        {[20, 40, 80].map(n => (
          <button key={n} onClick={() => setShowN(n)} style={{
            padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
            background: showN === n ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.12)', color: showN === n ? '#fff' : '#555',
          }}>{n}</button>
        ))}
        <button onClick={() => setLogScale(s => !s)} style={{
          marginLeft: 8, padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
          background: logScale ? 'rgba(234,179,8,0.15)' : 'transparent',
          border: `1px solid ${logScale ? '#eab308' : 'rgba(255,255,255,0.12)'}`,
          color: logScale ? '#eab308' : '#555',
        }}>log scale</button>
      </div>

      {/* chart */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', minHeight: 0 }}>
        <svg width={w} height={pad.top + sorted.length * (barH + 1) + pad.bottom} style={{ display: 'block' }}>
          {/* x axis ticks */}
          {xScale && xScale.ticks(4).map(t => {
            const x = pad.left + xScale(t);
            return (
              <g key={t} transform={`translate(${x},${pad.top + sorted.length * (barH + 1)})`}>
                <line y2={5} stroke="rgba(255,255,255,0.1)" />
                <text y={16} textAnchor="middle" fill="#333" fontSize={9}>{d3.format('~s')(t)}</text>
              </g>
            );
          })}
          <text x={pad.left + innerW / 2} y={pad.top + sorted.length * (barH + 1) + 34}
            textAnchor="middle" fill="#333" fontSize={10}>corpus occurrences</text>

          {/* bars */}
          {xScale && sorted.map((d, i) => {
            const barW = Math.max(1, xScale(d.total_corpus) - (logScale ? xScale(xScale.domain()[0]) : 0));
            const y = pad.top + i * (barH + 1);
            const isHov = hovered?.pair_key === d.pair_key;
            return (
              <g key={d.pair_key}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}>
                {isHov && <rect x={0} y={y} width={w} height={barH + 1} fill="rgba(255,255,255,0.025)" />}
                {/* rank label */}
                <text x={pad.left - 4} y={y + barH / 2} textAnchor="end" dominantBaseline="middle"
                  fill="#222" fontSize={8}>{d.rank}</text>
                {/* bar */}
                <rect x={pad.left} y={y} width={barW} height={barH}
                  fill={d.color} opacity={isHov ? 1 : 0.7} rx={1} />
                {/* Arabic label */}
                <text x={pad.left + barW + 4} y={y + barH / 2} dominantBaseline="middle"
                  fill={isHov ? '#fff' : d.color} fontSize={Math.min(barH, 11)}
                  fontFamily="serif" direction="rtl">
                  {d.pair_key}
                </text>
                {/* corpus value on wider bars */}
                {barW > 60 && (
                  <text x={pad.left + barW - 4} y={y + barH / 2} textAnchor="end" dominantBaseline="middle"
                    fill="rgba(0,0,0,0.5)" fontSize={8}>
                    {d3.format('~s')(d.total_corpus)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* hover detail */}
        {hovered && (
          <div style={{
            position: 'absolute', top: 8, right: 8, pointerEvents: 'none',
            background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '10px 14px', fontSize: 12, lineHeight: 1.8,
          }}>
            <div style={{ fontSize: 20, fontFamily: 'serif', color: hovered.color, marginBottom: 4 }}>{hovered.pair_key}</div>
            <div style={{ color: '#aaa' }}>rank: <span style={{ color: '#fff' }}>#{hovered.rank}</span></div>
            <div style={{ color: '#aaa' }}>corpus: <span style={{ color: '#eab308', fontWeight: 700 }}>{hovered.total_corpus.toLocaleString()}</span></div>
            <div style={{ color: '#aaa' }}>words: <span style={{ color: '#22c55e' }}>{hovered.total_words.toLocaleString()}</span></div>
            <div style={{ color: '#aaa' }}>share: <span style={{ color: '#a855f7' }}>
              {totalCorpus > 0 ? ((hovered.total_corpus / totalCorpus) * 100).toFixed(2) : '—'}%
            </span></div>
          </div>
        )}
      </div>
    </div>
  );
}
