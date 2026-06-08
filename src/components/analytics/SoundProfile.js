import { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useSize } from './shared';
import { PHON_CLASSES, CLASS_META } from './phonology';

// Back-of-throat → lips, arranged as a pentagon (top = guttural)
const CLS = ['guttural', 'dorsal', 'emphatic', 'coronal', 'labial'];
const ANGLES = CLS.map((_, i) => (2 * Math.PI / 5) * i - Math.PI / 2);

const pt = (i, v, cx, cy, r) => [
  cx + Math.cos(ANGLES[i]) * v * r,
  cy + Math.sin(ANGLES[i]) * v * r,
];
const poly = (vals, cx, cy, r) =>
  vals.map((v, i) => pt(i, v, cx, cy, r)).map(([x, y]) => `${x},${y}`).join(' ');

export default function SoundProfile({ biradicals, positions, corpusLabel }) {
  const [metric, setMetric] = useState('corpus');
  const [hovCell, setHovCell] = useState(null);
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);

  // ── Class totals from positions ──────────────────────────────────
  const classData = useMemo(() => {
    const g = {};
    CLS.forEach(c => { g[c] = { r1: 0, r2: 0, r3: 0 }; });
    positions.forEach(p => {
      const cls = PHON_CLASSES[p.radical]?.class;
      if (!cls || !g[cls]) return;
      const v = metric === 'corpus' ? p.corpus : metric === 'words' ? p.words : p.roots;
      g[cls][p.position] += v;
    });
    const result = CLS.map(cls => ({
      cls,
      r1: g[cls].r1, r2: g[cls].r2, r3: g[cls].r3,
      total: g[cls].r1 + g[cls].r2 + g[cls].r3,
      color: CLASS_META[cls]?.color || '#555',
      label: CLASS_META[cls]?.label || cls,
      members: CLASS_META[cls]?.members || '',
    }));
    const max = Math.max(...result.map(c => c.total), 1);
    return result.map(c => ({ ...c, norm: c.total / max, normR1: c.r1 / max, normR2: c.r2 / max }));
  }, [positions, metric]);

  // ── 5×5 pair matrix ──────────────────────────────────────────────
  const pairMatrix = useMemo(() => {
    const m = {};
    CLS.forEach(c1 => CLS.forEach(c2 => {
      m[`${c1}:${c2}`] = { c1, c2, corpus: 0, roots: 0, words: 0, pairs: [] };
    }));
    biradicals.forEach(d => {
      const [r1, r2] = d.pair_key.split('-');
      const c1 = PHON_CLASSES[r1]?.class;
      const c2 = PHON_CLASSES[r2]?.class;
      if (!c1 || !c2 || !m[`${c1}:${c2}`]) return;
      m[`${c1}:${c2}`].corpus += d.total_corpus;
      m[`${c1}:${c2}`].roots  += d.root_count;
      m[`${c1}:${c2}`].words  += d.total_words;
      m[`${c1}:${c2}`].pairs.push(d);
    });
    return m;
  }, [biradicals]);

  const matVals = useMemo(() =>
    Object.values(pairMatrix).map(v => v[metric]).filter(v => v > 0), [pairMatrix, metric]);
  const matScale = useMemo(() =>
    matVals.length
      ? d3.scaleLog().domain([Math.min(...matVals), Math.max(...matVals)]).range([0.05, 1]).clamp(true)
      : () => 0,
    [matVals]);

  const hovData    = hovCell ? pairMatrix[`${hovCell.c1}:${hovCell.c2}`] : null;
  const hovTopPairs = hovData
    ? [...hovData.pairs].sort((a, b) => b.total_corpus - a.total_corpus).slice(0, 5)
    : [];

  // ── OCP insight ──────────────────────────────────────────────────
  const ocpRatio = useMemo(() => {
    let sameSum = 0, sameCt = 0, crossSum = 0, crossCt = 0;
    Object.values(pairMatrix).forEach(v => {
      const val = v[metric];
      if (v.c1 === v.c2) { sameSum += val; sameCt++; }
      else               { crossSum += val; crossCt++; }
    });
    const r = crossCt && sameCt ? ((crossSum / crossCt) / Math.max(sameSum / sameCt, 1)).toFixed(1) : '—';
    return r;
  }, [pairMatrix, metric]);

  // Radar dimensions
  const radarSize  = Math.min((w || 400) * 0.48, (h || 400) * 0.72, 280);
  const cx         = radarSize / 2;
  const cy         = radarSize / 2;
  const R          = radarSize * 0.38;

  // Matrix cell size — fills remaining width
  const matSize    = Math.min((w || 400) * 0.44, (h || 400) * 0.72, 240);
  const cell       = Math.floor((matSize - 32) / 5);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ color: '#333', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Sound Profile{corpusLabel ? ` · ${corpusLabel}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {[['corpus','gravity'],['words','fertility'],['roots','depth']].map(([k, lbl]) => (
            <button key={k} onClick={() => setMetric(k)} style={{
              padding: '2px 8px', borderRadius: 5, fontSize: 9, cursor: 'pointer',
              background: metric === k ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: `1px solid ${metric === k ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
              color: metric === k ? '#fff' : '#444',
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* ── main: radar + matrix side by side ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 16px', minHeight: 0, flexWrap: 'wrap' }}>

        {/* Radar pentagon */}
        {w > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ color: '#222', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>class profile</div>
            <svg width={radarSize} height={radarSize}>
              {/* grid rings */}
              {[0.25, 0.5, 0.75, 1].map(t => (
                <polygon key={t} points={poly(CLS.map(() => t), cx, cy, R)}
                  fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
              ))}
              {/* axis lines */}
              {CLS.map((_, i) => {
                const [x, y] = pt(i, 1, cx, cy, R);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />;
              })}

              {/* r2 area (faint) */}
              <polygon
                points={poly(classData.map(c => c.normR2), cx, cy, R)}
                fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5}
              />
              {/* total area */}
              <polygon
                points={poly(classData.map(c => c.norm), cx, cy, R)}
                fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1}
              />
              {/* per-class filled wedge colors */}
              {classData.map((c, i) => {
                const [x0, y0] = pt(i, 0, cx, cy, R);
                const [x1, y1] = pt(i, c.norm, cx, cy, R);
                return (
                  <line key={c.cls} x1={cx} y1={cy} x2={x1} y2={y1}
                    stroke={c.color} strokeWidth={3} strokeOpacity={0.6} />
                );
              })}
              {/* class dots + labels */}
              {classData.map((c, i) => {
                const [dx, dy] = pt(i, 1.28, cx, cy, R);
                const [vx, vy] = pt(i, c.norm, cx, cy, R);
                return (
                  <g key={c.cls}>
                    <circle cx={vx} cy={vy} r={4} fill={c.color} opacity={0.85} />
                    <text x={dx} y={dy} textAnchor="middle" dominantBaseline="middle"
                      fill={c.color} fontSize={9} fontWeight={600}>
                      {c.label}
                    </text>
                    <text x={dx} y={dy + 11} textAnchor="middle" fill="#333" fontSize={7} fontFamily="serif">
                      {c.members}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* OCP note */}
            <div style={{ color: '#2a2a2a', fontSize: 9, textAlign: 'center' }}>
              cross-class {metric}: <span style={{ color: '#22c55e' }}>{ocpRatio}×</span> vs same-class
            </div>
          </div>
        )}

        {/* Pair matrix */}
        {w > 0 && cell > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ color: '#222', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>r1 × r2 class pairs</div>
            <svg width={cell * 5 + 32} height={cell * 5 + 32}>
              {/* col headers */}
              {CLS.map((c2, ci) => (
                <text key={c2} x={32 + ci * cell + cell / 2} y={10}
                  textAnchor="middle" fill={CLASS_META[c2]?.color} fontSize={8}>
                  {CLASS_META[c2]?.label?.slice(0, 3)}
                </text>
              ))}
              {/* row headers + cells */}
              {CLS.map((c1, ri) => (
                <g key={c1}>
                  <text x={28} y={16 + ri * cell + cell / 2}
                    textAnchor="end" dominantBaseline="middle"
                    fill={CLASS_META[c1]?.color} fontSize={8}>
                    {CLASS_META[c1]?.label?.slice(0, 3)}
                  </text>
                  {CLS.map((c2, ci) => {
                    const cell_d = pairMatrix[`${c1}:${c2}`];
                    const val    = cell_d?.[metric] || 0;
                    const alpha  = val > 0 ? matScale(val) : 0;
                    const isSame = c1 === c2;
                    const isHov  = hovCell?.c1 === c1 && hovCell?.c2 === c2;
                    return (
                      <rect key={c2}
                        x={32 + ci * cell} y={16 + ri * cell}
                        width={cell - 2} height={cell - 2} rx={2}
                        fill={isSame ? 'rgba(255,255,255,0.06)' : CLASS_META[c1]?.color}
                        fillOpacity={isSame ? 1 : alpha * 0.8}
                        stroke={isHov ? '#fff' : 'none'} strokeWidth={1.5}
                        style={{ cursor: val > 0 ? 'pointer' : 'default' }}
                        onMouseEnter={() => setHovCell({ c1, c2 })}
                        onMouseLeave={() => setHovCell(null)}
                      />
                    );
                  })}
                </g>
              ))}
            </svg>

            {/* hover tooltip for matrix */}
            <div style={{ height: 72, width: cell * 5 + 32, overflow: 'hidden' }}>
              {hovData && hovData[metric] > 0 ? (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
                    <span style={{ color: CLASS_META[hovData.c1]?.color }}>{CLASS_META[hovData.c1]?.label}</span>
                    {' '}+{' '}
                    <span style={{ color: CLASS_META[hovData.c2]?.color }}>{CLASS_META[hovData.c2]?.label}</span>
                    {' · '}{d3.format('~s')(hovData[metric])} {metric} · {hovData.pairs.length} families
                    {hovData.c1 === hovData.c2 && <span style={{ color: '#ef4444', marginLeft: 6 }}>OCP</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {hovTopPairs.map(d => {
                      const [r1] = d.pair_key.split('-');
                      return (
                        <span key={d.pair_key} style={{
                          fontSize: 12, fontFamily: 'serif',
                          color: CLASS_META[PHON_CLASSES[r1]?.class]?.color || '#eab308',
                          background: 'rgba(255,255,255,0.04)',
                          padding: '1px 7px', borderRadius: 4,
                        }}>{d.pair_key}</span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#1a1a1a', fontSize: 9, marginTop: 4 }}>hover a cell to see top families</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
