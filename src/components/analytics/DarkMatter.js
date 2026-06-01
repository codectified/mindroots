import { useMemo, useRef, useState } from 'react';
import { PHON_CLASSES, CLASS_META, sameClass } from './phonology';
import { useSize } from './shared';

// Dark Matter — Absent Bi-Radical Pairs
//
// Of all theoretically possible r1-r2 pairs among attested Arabic consonants,
// ~654 are present as BiRadicalCluster nodes. The rest are dark:
//
//   Gold  = mystery-absent: cross-class pairs with no OCP prediction for absence.
//           These are phonologically permitted but morphologically empty.
//           They are the true "dark matter" — the language could have gone there, but didn't.
//
//   Red   = OCP-absent: same phonological class, suppressed by articulatory constraint.
//           Expected by theory (McCarthy 1986, Frisch et al. 2004).
//
//   Green = attested: actually present in the data.
//
// The mystery pairs are the most linguistically interesting. Some may exist in
// obscure dialects, loanwords, or historical Arabic. Others may be forbidden by
// deeper phonotactic constraints not captured by the five-class model.

export default function DarkMatter({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);

  const { radicals, attestedSet, summary, mysteryPairs, ocpPairs } = useMemo(() => {
    const attSet = new Set(data.map(d => d.pair_key));
    const rads = Object.keys(PHON_CLASSES).sort();

    let total = 0, ocpAbsent = 0, mysteryAbsent = 0;
    const mystery = [], ocp = [];

    rads.forEach(r1 => {
      rads.forEach(r2 => {
        if (r1 === r2) return;
        total++;
        const key = `${r1}-${r2}`;
        if (!attSet.has(key)) {
          if (sameClass(r1, r2)) { ocpAbsent++; ocp.push({ pair: key, r1, r2 }); }
          else { mysteryAbsent++; mystery.push({ pair: key, r1, r2 }); }
        }
      });
    });

    mystery.sort((a, b) => {
      const ac = PHON_CLASSES[a.r1]?.class || '', bc = PHON_CLASSES[b.r1]?.class || '';
      return ac.localeCompare(bc) || a.pair.localeCompare(b.pair);
    });

    return {
      radicals: rads,
      attestedSet: attSet,
      summary: { total, attested: data.length, absent: total - data.length, ocpAbsent, mystery: mysteryAbsent },
      mysteryPairs: mystery,
      ocpPairs: ocp,
    };
  }, [data]);

  const n = radicals.length;
  const pad = { top: 26, left: 24, right: 4, bottom: 4 };

  // cell size: fit into left portion of the available width (leave room for list)
  const listWidth = Math.max(160, Math.floor(w * 0.35));
  const gridAvailW = w - listWidth - pad.left - pad.right - 8;
  const gridAvailH = h - pad.top - pad.bottom;
  const cellSize = Math.max(5, Math.min(18, Math.floor(Math.min(gridAvailW, gridAvailH) / n)));

  const classGroups = useMemo(() => {
    const groups = {};
    mysteryPairs.forEach(p => {
      const cls = PHON_CLASSES[p.r1]?.class || 'unknown';
      if (!groups[cls]) groups[cls] = [];
      groups[cls].push(p);
    });
    return groups;
  }, [mysteryPairs]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* summary stats */}
      <div style={{ display: 'flex', gap: 16, padding: '8px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto', flexWrap: 'nowrap' }}>
        {[
          { label: 'possible',    value: summary.total,    color: '#444'    },
          { label: 'attested',    value: summary.attested, color: '#22c55e' },
          { label: 'coverage',    value: `${((summary.attested / summary.total) * 100).toFixed(1)}%`, color: '#a855f7' },
          { label: 'OCP-absent',  value: summary.ocpAbsent,color: '#ef4444' },
          { label: 'mystery',     value: summary.mystery,  color: '#eab308' },
        ].map(s => (
          <div key={s.label} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: s.color, fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{s.value}</span>
            <span style={{ color: '#333', fontSize: 10 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* main content: heatmap + mystery list */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* grid */}
        <div style={{ flexShrink: 0, overflow: 'auto' }}>
          <svg width={pad.left + n * cellSize + pad.right} height={pad.top + n * cellSize + pad.bottom} style={{ display: 'block' }}>
            {/* col headers */}
            {radicals.map((r, ci) => (
              <text key={`c-${r}`}
                x={pad.left + ci * cellSize + cellSize / 2} y={pad.top - 3}
                textAnchor="middle" fill={PHON_CLASSES[r]?.color || '#444'}
                fontSize={Math.min(cellSize - 1, 9)} fontFamily="serif"
                style={{ userSelect: 'none' }}>
                {r}
              </text>
            ))}
            {/* row headers */}
            {radicals.map((r, ri) => (
              <text key={`r-${r}`}
                x={pad.left - 3} y={pad.top + ri * cellSize + cellSize / 2}
                textAnchor="end" dominantBaseline="middle"
                fill={PHON_CLASSES[r]?.color || '#444'}
                fontSize={Math.min(cellSize - 1, 9)} fontFamily="serif"
                style={{ userSelect: 'none' }}>
                {r}
              </text>
            ))}

            {/* cells */}
            {radicals.map((r1, ri) =>
              radicals.map((r2, ci) => {
                if (r1 === r2) return null;
                const key = `${r1}-${r2}`;
                const isPresent = attestedSet.has(key);
                const isOCP = sameClass(r1, r2);
                const isHov = hovered === key;
                const fill = isPresent
                  ? 'rgba(34,197,94,0.12)'
                  : isOCP
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(234,179,8,0.55)';
                return (
                  <rect key={key}
                    x={pad.left + ci * cellSize} y={pad.top + ri * cellSize}
                    width={cellSize - 1} height={cellSize - 1}
                    fill={isHov ? '#fff' : fill}
                    opacity={isHov ? 1 : 1}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })
            )}
          </svg>
        </div>

        {/* legend + mystery list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px', borderLeft: '1px solid rgba(255,255,255,0.04)' }}>

          {/* legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            {[
              { color: 'rgba(34,197,94,0.5)',  label: 'attested' },
              { color: 'rgba(239,68,68,0.5)',  label: 'OCP-absent (same class)' },
              { color: 'rgba(234,179,8,0.7)',  label: 'mystery dark matter' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#555' }}>
                <span style={{ width: 10, height: 10, background: l.color, display: 'inline-block', borderRadius: 2, flexShrink: 0 }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* mystery pairs grouped by r1 class */}
          <div style={{ color: '#333', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            {summary.mystery} mystery pairs
          </div>
          {Object.entries(classGroups).map(([cls, pairs]) => (
            <div key={cls} style={{ marginBottom: 10 }}>
              <div style={{ color: CLASS_META[cls]?.color || '#555', fontSize: 10, marginBottom: 4 }}>
                r1 {CLASS_META[cls]?.label || cls}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {pairs.map(p => (
                  <span key={p.pair}
                    style={{
                      padding: '2px 6px', borderRadius: 4, cursor: 'default',
                      background: hovered === p.pair ? 'rgba(234,179,8,0.3)' : 'rgba(234,179,8,0.1)',
                      border: `1px solid rgba(234,179,8,${hovered === p.pair ? 0.6 : 0.2})`,
                      fontSize: 13, fontFamily: 'serif', color: '#eab308',
                      direction: 'rtl',
                    }}
                    onMouseEnter={() => setHovered(p.pair)}
                    onMouseLeave={() => setHovered(null)}
                    title={`r1=${p.r1} (${PHON_CLASSES[p.r1]?.class}) × r2=${p.r2} (${PHON_CLASSES[p.r2]?.class})`}>
                    {p.r1}·{p.r2}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 60, left: 16, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.92)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px', fontSize: 12, lineHeight: 1.8, zIndex: 10,
        }}>
          <div style={{ fontSize: 22, fontFamily: 'serif', color: '#eab308', marginBottom: 4 }}>
            {hovered.split('-').join('·')}
          </div>
          <div style={{ color: '#aaa' }}>r1: <span style={{ color: PHON_CLASSES[hovered.split('-')[0]]?.color }}>{hovered.split('-')[0]} ({PHON_CLASSES[hovered.split('-')[0]]?.class})</span></div>
          <div style={{ color: '#aaa' }}>r2: <span style={{ color: PHON_CLASSES[hovered.split('-')[1]]?.color }}>{hovered.split('-')[1]} ({PHON_CLASSES[hovered.split('-')[1]]?.class})</span></div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1a1a1a', color: attestedSet.has(hovered) ? '#22c55e' : sameClass(hovered.split('-')[0], hovered.split('-')[1]) ? '#ef4444' : '#eab308', fontWeight: 700, fontSize: 11 }}>
            {attestedSet.has(hovered) ? 'attested family' : sameClass(hovered.split('-')[0], hovered.split('-')[1]) ? 'OCP-absent (same class)' : 'mystery dark matter'}
          </div>
        </div>
      )}
    </div>
  );
}
