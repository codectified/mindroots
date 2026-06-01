import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PHON_CLASSES, CLASS_ORDER, CLASS_META } from './phonology';
import { useSize } from './shared';

// OCP Class Matrix — Phonological Occupancy by Class Pair
//
// Rows = r1 phonological class, Cols = r2 phonological class.
// Cell value = % of theoretically possible r1-r2 pairs (within that class pair)
// that are actually attested in the BiRadicalCluster data.
//
// The Obligatory Contour Principle (McCarthy 1986) predicts:
//   same-class pairs → significantly underoccupied (dark diagonal)
//   cross-class pairs → closer to baseline occupancy
//
// This chart quantifies that directly from the graph data.
// Key number: how much higher is cross-class % vs same-class %?

export default function OCPMatrix({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);

  const { matrix, sameAvg, crossAvg } = useMemo(() => {
    const populated = new Set(data.map(d => d.pair_key));

    // Only use radicals actually present in the data
    const seenRadicals = new Set();
    data.forEach(d => {
      const [r1, r2] = d.pair_key.split('-');
      if (r1) seenRadicals.add(r1); if (r2) seenRadicals.add(r2);
    });

    // Group seen radicals by class
    const byClass = {};
    CLASS_ORDER.forEach(c => { byClass[c] = []; });
    seenRadicals.forEach(rad => {
      const cls = PHON_CLASSES[rad]?.class;
      if (cls && byClass[cls]) byClass[cls].push(rad);
    });

    const mat = {};
    CLASS_ORDER.forEach(c1 => {
      CLASS_ORDER.forEach(c2 => {
        const m1 = byClass[c1] || [], m2 = byClass[c2] || [];
        let possible = 0, pop = 0;
        m1.forEach(r1 => m2.forEach(r2 => {
          if (r1 === r2) return; // identical radical pairs never exist (OCP-identical)
          possible++;
          if (populated.has(`${r1}-${r2}`)) pop++;
        }));
        mat[`${c1}-${c2}`] = { possible, pop, pct: possible > 0 ? pop / possible : null };
      });
    });

    // Summary stats
    const samePcts  = CLASS_ORDER.map(c => mat[`${c}-${c}`]?.pct).filter(v => v != null);
    const crossPcts = [];
    CLASS_ORDER.forEach(c1 => CLASS_ORDER.forEach(c2 => {
      if (c1 !== c2) { const v = mat[`${c1}-${c2}`]?.pct; if (v != null) crossPcts.push(v); }
    }));
    const avg = arr => arr.reduce((s, v) => s + v, 0) / (arr.length || 1);

    return { matrix: mat, sameAvg: avg(samePcts), crossAvg: avg(crossPcts) };
  }, [data]);

  const maxPct = useMemo(() =>
    Math.max(...Object.values(matrix).map(c => c?.pct ?? 0)), [matrix]);

  const colorScale = d3.scaleSequential(d3.interpolate('#0d1117', '#22c55e')).domain([0, maxPct]);

  const pad = { top: 36, left: 70, right: 16, bottom: 50 };
  const n     = CLASS_ORDER.length;
  const cellW = Math.floor((w - pad.left - pad.right) / n);
  const cellH = Math.floor((h - pad.top - pad.bottom) / n);
  const ox    = pad.left, oy = pad.top;

  const ocpDelta = crossAvg - sameAvg;
  const ocpPct   = sameAvg > 0 ? (ocpDelta / crossAvg * 100) : 0;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {/* col headers */}
        {CLASS_ORDER.map((cls, ci) => (
          <text key={`ch-${cls}`}
            x={ox + ci * cellW + cellW / 2} y={oy - 8}
            textAnchor="middle" fill={CLASS_META[cls].color} fontSize={11} fontWeight="500">
            {CLASS_META[cls].label}
          </text>
        ))}
        {/* row headers */}
        {CLASS_ORDER.map((cls, ri) => (
          <text key={`rh-${cls}`}
            x={ox - 8} y={oy + ri * cellH + cellH / 2}
            textAnchor="end" dominantBaseline="middle"
            fill={CLASS_META[cls].color} fontSize={11} fontWeight="500">
            {CLASS_META[cls].label}
          </text>
        ))}

        {/* cells */}
        {CLASS_ORDER.map((c1, ri) =>
          CLASS_ORDER.map((c2, ci) => {
            const key  = `${c1}-${c2}`;
            const cell = matrix[key];
            const isSame = c1 === c2;
            const isHov  = hovered === key;
            const fill   = cell?.pct != null ? colorScale(cell.pct) : '#080c10';
            return (
              <g key={key}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}>
                <rect
                  x={ox + ci * cellW + 1} y={oy + ri * cellH + 1}
                  width={cellW - 2} height={cellH - 2}
                  fill={fill}
                  stroke={isHov ? '#fff' : isSame ? 'rgba(239,68,68,0.5)' : 'none'}
                  strokeWidth={isHov ? 1.5 : 1}
                />
                {cell?.pct != null && (
                  <>
                    <text
                      x={ox + ci * cellW + cellW / 2}
                      y={oy + ri * cellH + cellH / 2 - (cellH > 40 ? 7 : 0)}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={cell.pct > 0.5 ? '#000' : '#ccc'} fontSize={Math.min(cellH * 0.35, 18)} fontWeight="700">
                      {(cell.pct * 100).toFixed(0)}%
                    </text>
                    {cellH > 40 && (
                      <text
                        x={ox + ci * cellW + cellW / 2}
                        y={oy + ri * cellH + cellH / 2 + 12}
                        textAnchor="middle" dominantBaseline="middle"
                        fill={cell.pct > 0.5 ? 'rgba(0,0,0,0.55)' : '#444'} fontSize={9}>
                        {cell.pop}/{cell.possible}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* OCP finding callout */}
      <div style={{
        position: 'absolute', top: 12, right: 16,
        background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12, lineHeight: 1.9,
      }}>
        <div style={{ color: '#444', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>OCP signal</div>
        <div style={{ color: '#aaa' }}>same-class avg: <span style={{ color: '#ef4444', fontWeight: 700 }}>{(sameAvg * 100).toFixed(1)}%</span></div>
        <div style={{ color: '#aaa' }}>cross-class avg: <span style={{ color: '#22c55e', fontWeight: 700 }}>{(crossAvg * 100).toFixed(1)}%</span></div>
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1a1a1a', color: '#555', fontSize: 11 }}>
          {ocpDelta > 0.02
            ? `cross-class is ${ocpPct.toFixed(0)}% more occupied → OCP confirmed`
            : 'no strong OCP signal detected'}
        </div>
      </div>

      {/* hover tooltip */}
      {hovered && matrix[hovered] && (
        <div style={{
          position: 'absolute', bottom: 56, left: 16,
          background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none',
        }}>
          <div style={{ color: '#eab308', marginBottom: 4, fontSize: 14 }}>
            {CLASS_META[hovered.split('-')[0]]?.label} × {CLASS_META[hovered.split('-')[1]]?.label}
          </div>
          <div style={{ color: '#aaa' }}>
            attested: <span style={{ color: '#fff' }}>{matrix[hovered].pop}</span>
            {' '}/ possible: <span style={{ color: '#555' }}>{matrix[hovered].possible}</span>
          </div>
          <div style={{ color: '#aaa' }}>
            occupancy: <span style={{ color: hovered.split('-')[0] === hovered.split('-')[1] ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
              {matrix[hovered].pct != null ? (matrix[hovered].pct * 100).toFixed(1) + '%' : '—'}
            </span>
          </div>
          {hovered.split('-')[0] === hovered.split('-')[1] && (
            <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>same class — OCP-constrained</div>
          )}
        </div>
      )}

      {/* legend */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#333', fontSize: 11 }}>0% occupied</span>
        <svg width={100} height={10}>
          <defs><linearGradient id="ocp-g"><stop offset="0%" stopColor="#0d1117" /><stop offset="100%" stopColor="#22c55e" /></linearGradient></defs>
          <rect width={100} height={10} rx={3} fill="url(#ocp-g)" />
        </svg>
        <span style={{ color: '#555', fontSize: 11 }}>fully occupied</span>
      </div>
    </div>
  );
}
