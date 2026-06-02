import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PHON_CLASSES, CLASS_META } from './phonology';
import { useSize } from './shared';

// Directionality of Bi-Radical Pairs
//
// For every consonant pair {X,Y} where both X-Y and Y-X exist as attested
// bi-radical families, compute an asymmetry score:
//   asym = (fwd − rev) / (fwd + rev)   ∈ [−1, +1]
//   +1  = fwd completely dominates (X-Y far more productive than Y-X)
//   0   = symmetric (both orderings equally productive)
//   −1  = rev completely dominates (Y-X far more productive than X-Y)
//
// Pair view: diverging bars from center. Left = X-Y, Right = Y-X.
//   Bold label is the dominant ordering. Sorted by most asymmetric first.
//
// Class view: do phonological classes systematically prefer r1 or r2?
//   Tendency strip = per-class average toward r1 position.
//   5×5 matrix = which class wins when any two classes meet in a root.

const METRICS = [
  { key: 'corpus', label: 'corpus' },
  { key: 'words',  label: 'words'  },
  { key: 'depth',  label: 'r3 depth' },
  { key: 'roots',  label: 'roots'  },
];

export default function DirectionalityChart({ biradicals, depths }) {
  const wrapRef  = useRef();
  const { w, h } = useSize(wrapRef);
  const [metric,  setMetric]  = useState('corpus');
  const [view,    setView]    = useState('pairs');
  const [showN,   setShowN]   = useState(30);
  const [hovered, setHovered] = useState(null);

  const depthMap = useMemo(() => {
    const m = {};
    depths.forEach(d => { m[d.pair_key] = d.r3_count; });
    return m;
  }, [depths]);

  const biMap = useMemo(() => {
    const m = {};
    biradicals.forEach(d => { m[d.pair_key] = d; });
    return m;
  }, [biradicals]);

  const pairs = useMemo(() => {
    const seen = new Set();
    const result = [];
    biradicals.forEach(d => {
      const [r1, r2] = d.pair_key.split('-');
      const revKey = `${r2}-${r1}`;
      if (seen.has(d.pair_key) || seen.has(revKey)) return;
      const rev = biMap[revKey];
      if (!rev) return;
      seen.add(d.pair_key); seen.add(revKey);

      const val = (obj, m) => {
        if (m === 'words')  return obj.total_words  || 0;
        if (m === 'corpus') return obj.total_corpus || 0;
        if (m === 'depth')  return depthMap[obj.pair_key] || 0;
        if (m === 'roots')  return obj.root_count   || 0;
        return 0;
      };
      const entry = { fwdKey: d.pair_key, revKey, r1, r2 };
      METRICS.forEach(({ key: m }) => {
        const f = val(d, m), r = val(rev, m);
        entry[`fwd_${m}`] = f; entry[`rev_${m}`] = r;
        entry[`asym_${m}`] = (f + r) > 0 ? (f - r) / (f + r) : 0;
      });
      result.push(entry);
    });
    return result;
  }, [biradicals, biMap, depthMap]);

  const sorted = useMemo(() =>
    [...pairs].sort((a, b) => Math.abs(b[`asym_${metric}`]) - Math.abs(a[`asym_${metric}`])).slice(0, showN),
    [pairs, metric, showN]);

  // Notable outliers: top 4 most asymmetric pairs for current metric
  const notablePairs = useMemo(() =>
    [...pairs]
      .filter(p => Math.abs(p[`asym_${metric}`]) > 0.25)
      .sort((a, b) => Math.abs(b[`asym_${metric}`]) - Math.abs(a[`asym_${metric}`]))
      .slice(0, 4)
      .map(p => {
        const asym = p[`asym_${metric}`];
        const dom = asym > 0 ? p.fwdKey : p.revKey;
        const sub = asym > 0 ? p.revKey : p.fwdKey;
        const domR1 = dom.split('-')[0];
        const subR1 = sub.split('-')[0];
        return {
          ...p, dom, sub,
          domCol:  PHON_CLASSES[domR1]?.color || '#666',
          subCol:  PHON_CLASSES[subR1]?.color || '#666',
          domCls:  PHON_CLASSES[domR1]?.class || '',
          subCls:  PHON_CLASSES[dom.split('-')[1]]?.class || '',
          pct:     Math.round(Math.abs(asym) * 100),
        };
      }),
    [pairs, metric]);

  // Balance: how many pairs favor each direction
  const balance = useMemo(() => {
    const fwdWins = pairs.filter(p => p[`asym_${metric}`] > 0.05).length;
    const revWins = pairs.filter(p => p[`asym_${metric}`] < -0.05).length;
    const tied    = pairs.length - fwdWins - revWins;
    return { fwdWins, revWins, tied };
  }, [pairs, metric]);

  // Class matrix
  const classMatrix = useMemo(() => {
    const cells = {};
    const clsNames = Object.keys(CLASS_META);
    clsNames.forEach(ca => clsNames.forEach(cb => {
      if (ca === cb) return;
      const rel = pairs.filter(p => {
        const fc = PHON_CLASSES[p.r1]?.class, rc = PHON_CLASSES[p.r2]?.class;
        return (fc === ca && rc === cb) || (fc === cb && rc === ca);
      });
      if (!rel.length) return;
      const avg = rel.reduce((s, p) => s + (PHON_CLASSES[p.r1]?.class === ca ? 1 : -1) * p[`asym_${metric}`], 0) / rel.length;
      cells[`${ca}|${cb}`] = { avg, n: rel.length };
    }));
    return cells;
  }, [pairs, metric]);

  // Per-class r1 tendency
  const classTendency = useMemo(() =>
    Object.entries(CLASS_META).map(([cls, meta]) => {
      const rel = pairs.filter(p => PHON_CLASSES[p.r1]?.class === cls || PHON_CLASSES[p.r2]?.class === cls);
      if (!rel.length) return { cls, meta, avg: 0, n: 0 };
      const avg = rel.reduce((s, p) => s + (PHON_CLASSES[p.r1]?.class === cls ? 1 : -1) * p[`asym_${metric}`], 0) / rel.length;
      return { cls, meta, avg, n: rel.length };
    }).sort((a, b) => b.avg - a.avg),
    [pairs, metric]);

  // Plain-English class finding
  const classFinding = useMemo(() => {
    const leaders   = classTendency.filter(c => c.avg > 0.04).map(c => c.meta.label);
    const followers = classTendency.filter(c => c.avg < -0.04).map(c => c.meta.label);
    if (!leaders.length && !followers.length) return 'No strong class-level positional preference — classes are roughly symmetric.';
    const parts = [];
    if (leaders.length)  parts.push(`${leaders.join(' & ')} tend to be more productive as r1 (root anchors)`);
    if (followers.length) parts.push(`${followers.join(' & ')} tend to be more productive as r2 (root followers)`);
    return parts.join('. ') + '.';
  }, [classTendency]);

  // Most dominant matrix cell (plain-English)
  const topMatrixCell = useMemo(() => {
    const sorted = Object.entries(classMatrix).sort((a, b) => Math.abs(b[1].avg) - Math.abs(a[1].avg));
    if (!sorted.length) return null;
    const [key, { avg, n }] = sorted[0];
    const [ca, cb] = key.split('|');
    const dom = avg > 0 ? ca : cb;
    const sub = avg > 0 ? cb : ca;
    return { dom, sub, pct: Math.round(Math.abs(avg) * 100), n };
  }, [classMatrix]);

  const clsNames  = Object.keys(CLASS_META);
  const cx        = w / 2;
  const BAR_PAD   = 80;
  const barMaxW   = Math.max(1, cx - BAR_PAD - 4);
  const maxVal    = d3.max(sorted, p => Math.max(p[`fwd_${metric}`], p[`rev_${metric}`])) || 1;
  const scale     = d3.scaleLinear([0, maxVal], [0, barMaxW]);
  const rowH      = Math.max(14, Math.min(20, Math.floor((h - 200) / Math.min(showN, 25))));
  // Matrix cell size based on available width only — let height scroll
  const matCell   = Math.max(40, Math.min(80, Math.floor((w - 32 - 82) / clsNames.length)));
  const strongCount = pairs.filter(p => Math.abs(p[`asym_${metric}`]) > 0.2).length;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Controls */}
      <div style={{ padding: '8px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#444', fontSize: 11 }}>view:</span>
          {[['pairs', 'pair asymmetry'], ['classes', 'class dominance']].map(([k, lbl]) => (
            <button key={k} onClick={() => setView(k)} style={{
              padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
              background: view === k ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: `1px solid ${view === k ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
              color: view === k ? '#fff' : '#555',
            }}>{lbl}</button>
          ))}
          <span style={{ color: '#444', fontSize: 11, marginLeft: 8 }}>metric:</span>
          {METRICS.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)} style={{
              padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
              background: metric === m.key ? 'rgba(234,179,8,0.15)' : 'transparent',
              border: `1px solid ${metric === m.key ? '#eab308' : 'rgba(255,255,255,0.07)'}`,
              color: metric === m.key ? '#eab308' : '#555',
            }}>{m.label}</button>
          ))}
          {view === 'pairs' && (
            <>
              <span style={{ color: '#333', fontSize: 11, marginLeft: 4 }}>top:</span>
              {[20, 30, 50].map(n => (
                <button key={n} onClick={() => setShowN(n)} style={{
                  padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                  background: showN === n ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: `1px solid ${showN === n ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  color: showN === n ? '#fff' : '#444',
                }}>{n}</button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ padding: '6px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#eab308', fontWeight: 700, fontSize: 13 }}>{pairs.length} reversible pairs</span>
        <span style={{ color: '#555', fontSize: 11 }}>
          {balance.fwdWins} favor r1-r2 · {balance.revWins} favor r2-r1 · {balance.tied} tied
        </span>
        <span style={{ color: '#333', fontSize: 11 }}>{strongCount} show &gt;20% asymmetry</span>
      </div>

      {/* Notable pairs callout */}
      {view === 'pairs' && notablePairs.length > 0 && (
        <div style={{ padding: '6px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ color: '#333', fontSize: 10, display: 'block', marginBottom: 5 }}>most asymmetric pairs by {metric}:</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {notablePairs.map(p => (
              <div key={p.dom} style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '5px 10px', fontSize: 11, lineHeight: 1.5,
              }}>
                <span style={{ fontFamily: 'serif', color: p.domCol, fontWeight: 700, fontSize: 14 }}>{p.dom}</span>
                <span style={{ color: '#333' }}> vs </span>
                <span style={{ fontFamily: 'serif', color: '#333', fontSize: 13 }}>{p.sub}</span>
                <span style={{ color: '#eab308', marginLeft: 6 }}>{p.pct}% advantage</span>
                <span style={{ color: '#2a2a2a', fontSize: 10, display: 'block' }}>
                  {p.domCls} anchors {p.subCls}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart area (scrollable) */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', minHeight: 0 }}>

        {/* ── Pair asymmetry view ─────────────────────────────── */}
        {view === 'pairs' && w > 0 && (
          <svg width={w} height={Math.max(h - 100, sorted.length * (rowH + 2) + 44)} style={{ display: 'block' }}>
            <line x1={cx} y1={22} x2={cx} y2={sorted.length * (rowH + 2) + 28}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            <text x={cx - 8} y={16} textAnchor="end"   fill="#2a2a2a" fontSize={9}>← r1-r2</text>
            <text x={cx + 8} y={16} textAnchor="start" fill="#2a2a2a" fontSize={9}>r2-r1 →</text>

            {sorted.map((p, i) => {
              const asym   = p[`asym_${metric}`];
              const fwdW   = scale(p[`fwd_${metric}`]);
              const revW   = scale(p[`rev_${metric}`]);
              const fwdCol = PHON_CLASSES[p.r1]?.color || '#666';
              const revCol = PHON_CLASSES[p.r2]?.color || '#666';
              const fwdDom = asym >= 0;
              const y      = 22 + i * (rowH + 2);
              const isHov  = hovered?.fwdKey === p.fwdKey;

              return (
                <g key={p.fwdKey}
                  onMouseEnter={() => setHovered(p)}
                  onMouseLeave={() => setHovered(null)}>
                  {isHov && <rect x={0} y={y - 1} width={w} height={rowH + 2} fill="rgba(255,255,255,0.025)" />}
                  <rect x={cx - fwdW} y={y + 1} width={fwdW} height={rowH - 2}
                    fill={fwdCol} opacity={fwdDom ? 0.8 : 0.22} rx={1} />
                  <rect x={cx}        y={y + 1} width={revW} height={rowH - 2}
                    fill={revCol} opacity={fwdDom ? 0.22 : 0.8} rx={1} />
                  <text x={Math.max(4, cx - fwdW - 4)} y={y + rowH / 2}
                    textAnchor="end" dominantBaseline="middle"
                    fill={fwdDom ? fwdCol : '#333'} fontSize={Math.min(rowH - 1, 11)}
                    fontFamily="serif" fontWeight={fwdDom ? 700 : 400}>
                    {p.fwdKey}
                  </text>
                  <text x={Math.min(w - 4, cx + revW + 4)} y={y + rowH / 2}
                    textAnchor="start" dominantBaseline="middle"
                    fill={fwdDom ? '#333' : revCol} fontSize={Math.min(rowH - 1, 11)}
                    fontFamily="serif" fontWeight={fwdDom ? 400 : 700}>
                    {p.revKey}
                  </text>
                  {Math.abs(asym) > 0.05 && Math.max(fwdW, revW) > 28 && (
                    <text x={fwdDom ? cx - fwdW / 2 : cx + revW / 2} y={y + rowH / 2}
                      textAnchor="middle" dominantBaseline="middle"
                      fill="rgba(0,0,0,0.5)" fontSize={8}>
                      {Math.round(Math.abs(asym) * 100)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* ── Class dominance view ────────────────────────────── */}
        {view === 'classes' && w > 0 && (
          <div style={{ padding: '14px 16px' }}>

            {/* Key finding */}
            <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.12)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>
              <span style={{ color: '#eab308', fontWeight: 700, marginRight: 6 }}>Key finding:</span>
              {classFinding}
              {topMatrixCell && (
                <span style={{ color: '#666' }}>
                  {' '}Strongest pair: <span style={{ color: CLASS_META[topMatrixCell.dom]?.color }}>{topMatrixCell.dom}</span> in r1 outperforms <span style={{ color: CLASS_META[topMatrixCell.sub]?.color }}>{topMatrixCell.sub}</span> in r1 by {topMatrixCell.pct}% on average (n={topMatrixCell.n}).
                </span>
              )}
            </div>

            {/* Class tendency strip */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ color: '#444', fontSize: 11, marginBottom: 8 }}>
                r1 tendency — positive = more productive as r1 (root anchor) · negative = more productive as r2 (follower)
              </div>
              {classTendency.map(({ cls, meta, avg, n }) => {
                const barW = Math.min(160, Math.abs(avg) * 260);
                return (
                  <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 62, fontSize: 11, color: meta.color, textAlign: 'right', flexShrink: 0 }}>{meta.label}</span>
                    <div style={{ position: 'relative', width: 160, height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 2, flexShrink: 0 }}>
                      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{
                        position: 'absolute',
                        left:   avg >= 0 ? '50%' : `calc(50% - ${barW}px)`,
                        width:  barW, height: '100%',
                        background: avg >= 0 ? meta.color : '#555',
                        opacity: 0.75, borderRadius: 2,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: avg > 0.04 ? meta.color : avg < -0.04 ? '#555' : '#333', width: 44 }}>
                      {avg >= 0 ? '+' : ''}{Math.round(avg * 100)}%
                    </span>
                    <span style={{ fontSize: 10, color: avg > 0.04 ? '#666' : avg < -0.04 ? '#444' : '#2a2a2a' }}>
                      {avg > 0.04 ? '→ leads' : avg < -0.04 ? '→ follows' : '≈ neutral'}
                    </span>
                    <span style={{ fontSize: 9, color: '#222', marginLeft: 4 }}>n={n}</span>
                  </div>
                );
              })}
            </div>

            {/* 5×5 matrix */}
            <div style={{ color: '#444', fontSize: 11, marginBottom: 8 }}>
              class × class matrix — <span style={{ color: '#22c55e' }}>green</span> = row class as r1 dominates ·
              <span style={{ color: '#ef4444' }}> red</span> = column class as r1 dominates ·
              intensity = strength of advantage
            </div>
            <div style={{ overflowX: 'auto' }}>
              <svg width={82 + matCell * clsNames.length + 4} height={40 + matCell * clsNames.length + 24} style={{ display: 'block' }}>
                {/* r2 column headers */}
                {clsNames.map((cls, ci) => (
                  <text key={`ch-${cls}`}
                    x={82 + ci * matCell + matCell / 2} y={13}
                    textAnchor="middle" fill={CLASS_META[cls]?.color || '#666'}
                    fontSize={Math.min(10, matCell / 5)}>
                    {cls.slice(0, 4)}
                  </text>
                ))}
                <text x={82 + clsNames.length * matCell / 2} y={25}
                  textAnchor="middle" fill="#2a2a2a" fontSize={9}>r2 class →</text>

                {/* r1 row headers */}
                {clsNames.map((cls, ri) => (
                  <text key={`rh-${cls}`}
                    x={76} y={40 + ri * matCell + matCell / 2}
                    textAnchor="end" dominantBaseline="middle"
                    fill={CLASS_META[cls]?.color || '#666'}
                    fontSize={Math.min(10, matCell / 5)}>
                    {cls.slice(0, 4)}
                  </text>
                ))}
                <text transform={`translate(14,${40 + clsNames.length * matCell / 2}) rotate(-90)`}
                  textAnchor="middle" fill="#2a2a2a" fontSize={9}>r1 class →</text>

                {/* Cells */}
                {clsNames.map((ca, ri) =>
                  clsNames.map((cb, ci) => {
                    const mx = 82 + ci * matCell;
                    const my = 40 + ri * matCell;
                    if (ca === cb) return (
                      <rect key={`${ca}|${cb}`} x={mx + 1} y={my + 1}
                        width={matCell - 2} height={matCell - 2}
                        fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" rx={3} />
                    );
                    const cell = classMatrix[`${ca}|${cb}`];
                    if (!cell) return (
                      <rect key={`${ca}|${cb}`} x={mx + 1} y={my + 1}
                        width={matCell - 2} height={matCell - 2} fill="rgba(255,255,255,0.01)" rx={3} />
                    );
                    const { avg, n } = cell;
                    const intensity  = Math.min(Math.abs(avg) * 2.2, 1);
                    const fill       = avg > 0
                      ? d3.interpolate('#0c180c', '#1a5c1a')(intensity)
                      : d3.interpolate('#180c0c', '#5c1a1a')(intensity);
                    const txtCol     = intensity > 0.3 ? '#ddd' : '#444';
                    return (
                      <g key={`${ca}|${cb}`}>
                        <rect x={mx + 1} y={my + 1} width={matCell - 2} height={matCell - 2} fill={fill} rx={3} />
                        <text x={mx + matCell / 2} y={my + matCell / 2 - (matCell > 44 ? 6 : 0)}
                          textAnchor="middle" dominantBaseline="middle"
                          fill={txtCol} fontSize={Math.min(13, matCell / 3.5)} fontWeight={700}>
                          {avg > 0 ? '+' : ''}{Math.round(avg * 100)}%
                        </text>
                        {matCell > 44 && (
                          <text x={mx + matCell / 2} y={my + matCell / 2 + 10}
                            textAnchor="middle" fill={txtCol} fontSize={Math.min(9, matCell / 6)} opacity={0.55}>
                            n={n}
                          </text>
                        )}
                      </g>
                    );
                  })
                )}
              </svg>
            </div>
            <div style={{ marginTop: 10, color: '#2a2a2a', fontSize: 10, lineHeight: 1.7 }}>
              Read row by column: a green cell means the row class (as r1) outperforms the column class (as r1) for that pair type.
              A red cell means the column class is more productive in r1 position. Diagonal = same class (excluded — OCP territory).
            </div>
          </div>
        )}

        {/* Hover tooltip */}
        {hovered && view === 'pairs' && (
          <div style={{
            position: 'absolute', top: 8, right: 8, pointerEvents: 'none',
            background: 'rgba(0,0,0,0.93)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8, padding: '10px 14px', fontSize: 12, lineHeight: 1.8, maxWidth: 230,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontFamily: 'serif', color: PHON_CLASSES[hovered.r1]?.color }}>{hovered.fwdKey}</span>
              <span style={{ color: '#333' }}>↔</span>
              <span style={{ fontSize: 18, fontFamily: 'serif', color: PHON_CLASSES[hovered.r2]?.color }}>{hovered.revKey}</span>
            </div>
            <div style={{ color: '#333', fontSize: 10, marginBottom: 6 }}>
              {PHON_CLASSES[hovered.r1]?.class} · {PHON_CLASSES[hovered.r2]?.class}
            </div>
            {METRICS.map(({ key, label }) => {
              const fv = hovered[`fwd_${key}`] || 0;
              const rv = hovered[`rev_${key}`] || 0;
              const av = hovered[`asym_${key}`] || 0;
              const col = key === 'corpus' ? '#ef4444' : key === 'words' ? '#22c55e' : key === 'depth' ? '#a855f7' : '#fff';
              return (
                <div key={key} style={{ color: '#555', fontSize: 11 }}>
                  {label}:
                  <span style={{ color: col }}> {fv.toLocaleString()}</span>
                  <span style={{ color: '#222' }}> / </span>
                  <span style={{ color: col, opacity: 0.5 }}>{rv.toLocaleString()}</span>
                  {Math.abs(av) > 0.01 && (
                    <span style={{ color: '#444', fontSize: 9 }}>
                      {' '}({av > 0 ? '← ' : '→ '}{Math.round(Math.abs(av) * 100)}%)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
