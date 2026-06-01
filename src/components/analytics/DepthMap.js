import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useSize } from './shared';

// r3 Completion Depth Map
//
// Same grid as the bi-radical heatmap (r1 × r2), but color = how many
// distinct r3 consonants complete this pair into an attested tri-radical root.
//
// Interpretation:
//   Black cell  → no bi-radical family here at all (structurally absent)
//   Dark cell   → family exists but few r3 completions (narrow)
//   Bright cell → many r3 completions (broad, "expansive" core)
//
// The pairs with the most r3 completions are the most productive cores —
// the language has committed to them most deeply.

export default function DepthMap({ biradicals, depths }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);

  const { radicals, depthMap, biradicalMap, colorScale, maxDepth } = useMemo(() => {
    const r1set = new Set(), r2set = new Set();
    biradicals.forEach(d => {
      const [a, b] = d.pair_key.split('-');
      if (a) r1set.add(a); if (b) r2set.add(b);
    });
    const rads = [...new Set([...r1set, ...r2set])].sort();

    const dm = {}, bm = {};
    biradicals.forEach(d => { bm[d.pair_key] = d; });
    depths.forEach(d => { dm[d.pair_key] = d; });

    const max = Math.max(...depths.map(d => d.r3_count), 1);
    const color = d3.scaleSequential(d3.interpolate('#111827', '#a855f7')).domain([0, max]);

    return { radicals: rads, depthMap: dm, biradicalMap: bm, colorScale: color, maxDepth: max };
  }, [biradicals, depths]);

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
        {/* col labels */}
        {radicals.map((rad, ci) => (
          <text key={`col-${rad}`}
            x={offsetX + ci * cellSize + cellSize / 2} y={offsetY - 6}
            textAnchor="middle" fill="#555" fontSize={Math.min(cellSize - 2, 11)}
            style={{ fontFamily: 'serif', direction: 'rtl' }}>
            {rad}
          </text>
        ))}
        {/* row labels */}
        {radicals.map((rad, ri) => (
          <text key={`row-${rad}`}
            x={offsetX - 6} y={offsetY + ri * cellSize + cellSize / 2}
            textAnchor="end" dominantBaseline="middle" fill="#555"
            fontSize={Math.min(cellSize - 2, 11)}
            style={{ fontFamily: 'serif', direction: 'rtl' }}>
            {rad}
          </text>
        ))}
        {/* cells */}
        {radicals.map((r1, ri) =>
          radicals.map((r2, ci) => {
            const key   = `${r1}-${r2}`;
            const depth = depthMap[key];
            const brd   = biradicalMap[key];
            const isHov = hovered?.key === key;
            // black = no family; dark purple = 0 r3 recorded; bright = many
            const fill  = depth ? colorScale(depth.r3_count) : brd ? '#1a1a2e' : '#0d0d12';
            return (
              <rect key={key}
                x={offsetX + ci * cellSize} y={offsetY + ri * cellSize}
                width={cellSize - 1} height={cellSize - 1}
                fill={fill}
                stroke={isHov ? '#fff' : 'none'} strokeWidth={1.5}
                onMouseEnter={() => setHovered({ key, depth, brd })}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })
        )}
      </svg>

      {/* tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 16, right: 16, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.75,
        }}>
          <div style={{ fontSize: 20, fontFamily: 'serif', color: '#a855f7', marginBottom: 4 }}>
            {hovered.key}
          </div>
          {!hovered.brd ? (
            <div style={{ color: '#333', fontStyle: 'italic' }}>structurally absent</div>
          ) : !hovered.depth ? (
            <div style={{ color: '#555' }}>family exists · no r3 data</div>
          ) : (
            <>
              <div style={{ color: '#aaa' }}>
                r3 completions: <span style={{ color: '#a855f7', fontWeight: 600 }}>{hovered.depth.r3_count}</span>
                <span style={{ color: '#555' }}> / 28 possible</span>
              </div>
              <div style={{ color: '#aaa' }}>
                r3 values: <span style={{ color: '#fff', fontFamily: 'serif', direction: 'rtl', display: 'inline-block' }}>
                  {hovered.depth.r3_values?.join(' · ')}
                </span>
              </div>
              {hovered.brd && (
                <div style={{ color: '#aaa', marginTop: 4, paddingTop: 4, borderTop: '1px solid #1a1a1a' }}>
                  roots: <span style={{ color: '#fff' }}>{hovered.brd.root_count}</span>
                  &nbsp;· words: <span style={{ color: '#22c55e' }}>{hovered.brd.total_words?.toLocaleString()}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* legend */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#333', fontSize: 11 }}>absent</span>
        <svg width={120} height={10}>
          <defs>
            <linearGradient id="dm-grad">
              <stop offset="0%"   stopColor="#111827" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <rect width={120} height={10} rx={3} fill="url(#dm-grad)" />
        </svg>
        <span style={{ color: '#555', fontSize: 11 }}>{maxDepth} r3s</span>
      </div>
    </div>
  );
}
