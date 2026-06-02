import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PHON_CLASSES, CLASS_META } from './phonology';
import { useSize } from './shared';

// Radical Leadership Score
//
// For each radical: leadership = r1_roots / (r1_roots + r2_roots + r3_roots)
//
// A high score (→ 1.0) means the radical strongly prefers initiating roots (r1).
// A low score (→ 0.0) means it prefers following (r3 dominant).
// A mid score (~0.33) means positionally neutral.
//
// Three bars per radical show absolute values (roots in each position)
// to disambiguate: a low leadership score from a large family is different
// from a low leadership score from a small family.
//
// Colored by phonological class — if a class (e.g. guttural) clusters
// toward low leadership, that's a structural finding about where
// phonological classes fit in the Arabic morphological hierarchy.

const POS_COLORS = { r1: '#22c55e', r2: '#3b82f6', r3: '#a855f7' };

export default function LeadershipChart({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);
  const [sortBy, setSortBy] = useState('leadership'); // 'leadership' | 'total' | 'class'

  const radicals = useMemo(() => {
    const map = {};
    data.forEach(d => {
      if (!map[d.radical]) map[d.radical] = { id: d.radical, r1: 0, r2: 0, r3: 0 };
      map[d.radical][d.position] = d.roots;
    });

    return Object.values(map).map(r => {
      const total      = r.r1 + r.r2 + r.r3;
      const leadership = total > 0 ? r.r1 / total : 0;
      const phon       = PHON_CLASSES[r.id] || { class: 'unknown', color: '#555' };
      return { ...r, total, leadership, phon };
    }).sort((a, b) => {
      if (sortBy === 'leadership') return b.leadership - a.leadership;
      if (sortBy === 'total')      return b.total - a.total;
      if (sortBy === 'class')      return a.phon.class.localeCompare(b.phon.class) || b.leadership - a.leadership;
      return 0;
    });
  }, [data, sortBy]);

  const maxTotal = useMemo(() => Math.max(...radicals.map(r => r.total)), [radicals]);
  const n = radicals.length;

  const m = { top: 8, right: w > 0 ? Math.min(200, Math.max(80, w - 260)) : 200, bottom: 8, left: 40 };
  const rowH    = Math.max(16, Math.min(28, Math.floor((h - m.top - m.bottom) / (n || 1))));
  const barZone = w - m.left - m.right;
  const halfW   = barZone * 0.45; // left half = leadership bar, right half = absolute bars

  const lScale = d3.scaleLinear().domain([0, 1]).range([0, halfW]);
  const aScale = d3.scaleSqrt().domain([0, maxTotal]).range([0, halfW * 0.85]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '8px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#444', fontSize: 11, flexShrink: 0 }}>sort:</span>
          {[['leadership', 'leadership score'], ['total', 'total roots'], ['class', 'phon. class']].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
              background: sortBy === key ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: sortBy === key ? '#fff' : '#555',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(CLASS_META).map(([cls, meta]) => (
            <span key={cls} style={{ fontSize: 10, color: meta.color, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      {/* column headers */}
      <div style={{ display: 'flex', paddingLeft: m.left + 4, paddingRight: m.right, flexShrink: 0, marginBottom: 2 }}>
        <div style={{ flex: 1, fontSize: 10, color: '#333' }}>leadership (r1 share)</div>
        <div style={{ width: halfW, fontSize: 10, color: '#333', paddingLeft: 8 }}>absolute roots by position</div>
      </div>

      {/* chart */}
      <div ref={wrapRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <svg width={w} height={Math.max(h, n * rowH + m.top + m.bottom)} style={{ display: 'block' }}>
          {/* center guideline at 0.33 (neutral) */}
          <line
            x1={m.left + lScale(0.333)} y1={m.top}
            x2={m.left + lScale(0.333)} y2={Math.max(h, n * rowH)}
            stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"
          />

          {radicals.map((r, ri) => {
            const y0   = m.top + ri * rowH;
            const isHov = hovered === r.id;
            const barH  = Math.floor(rowH * 0.32);
            const barGap = 2;
            const barsTop = y0 + (rowH - barH * 3 - barGap * 2) / 2;

            return (
              <g key={r.id}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}>
                {isHov && <rect x={0} y={y0} width={w} height={rowH} fill="rgba(255,255,255,0.025)" />}

                {/* radical label */}
                <text x={m.left - 4} y={y0 + rowH / 2}
                  textAnchor="end" dominantBaseline="middle"
                  fill={isHov ? '#fff' : r.phon.color}
                  fontSize={Math.min(rowH - 3, 14)}
                  style={{ fontFamily: 'serif' }}>
                  {r.id}
                </text>

                {/* leadership bar */}
                <rect
                  x={m.left} y={y0 + rowH * 0.2}
                  width={lScale(r.leadership)} height={rowH * 0.6}
                  fill={r.phon.color} opacity={0.7} rx={2}
                />
                {/* leadership % label */}
                <text
                  x={m.left + lScale(r.leadership) + 4} y={y0 + rowH / 2}
                  dominantBaseline="middle" fill={isHov ? '#fff' : '#555'} fontSize={9}>
                  {(r.leadership * 100).toFixed(0)}%
                </text>

                {/* absolute position bars (r1/r2/r3) */}
                {(['r1','r2','r3']).map((pos, pi) => (
                  <rect key={pos}
                    x={m.left + halfW + 8}
                    y={barsTop + pi * (barH + barGap)}
                    width={Math.max(1, aScale(r[pos]))}
                    height={barH}
                    fill={POS_COLORS[pos]} opacity={0.75} rx={1}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* hover tooltip */}
        {hovered && (() => {
          const r = radicals.find(x => x.id === hovered);
          if (!r) return null;
          return (
            <div style={{
              position: 'absolute', top: 8, right: m.right + 8, pointerEvents: 'none',
              background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.75,
            }}>
              <div style={{ fontSize: 22, fontFamily: 'serif', color: r.phon.color, marginBottom: 4 }}>{r.id}</div>
              <div style={{ color: '#aaa' }}>class: <span style={{ color: r.phon.color }}>{r.phon.class}</span></div>
              <div style={{ color: '#aaa' }}>leadership: <span style={{ color: '#fff', fontWeight: 700 }}>{(r.leadership * 100).toFixed(1)}%</span></div>
              <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
                {r.leadership > 0.45 ? 'initiator — strongly prefers r1'
                  : r.leadership < 0.25 ? 'follower — avoids r1'
                  : 'generalist — positionally flexible'}
              </div>
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1a1a1a' }}>
                {['r1','r2','r3'].map(p => (
                  <div key={p} style={{ color: '#aaa' }}>{p}: <span style={{ color: POS_COLORS[p] }}>{r[p].toLocaleString()}</span> roots</div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
