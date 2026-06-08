import { useMemo, useState } from 'react';
import { PHON_CLASSES, CLASS_META } from './phonology';

const METRIC_OPTS = [['corpus','gravity'],['words','fertility'],['roots','depth']];

const getColor = rad => CLASS_META[PHON_CLASSES[rad]?.class]?.color || '#555';

function ConsonantStrip({ items, maxVal }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      {items.map(({ rad, val, color }) => (
        <div key={rad} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 13, fontFamily: 'serif', color, minWidth: 14, textAlign: 'center', lineHeight: 1 }}>
            {rad}
          </span>
          <div style={{
            width: Math.max(3, Math.round((val / maxVal) * 52)),
            height: 3, background: color, opacity: 0.65, borderRadius: 2,
          }} />
        </div>
      ))}
    </div>
  );
}

export default function Overview({ biradicals, positions, depths, topRoots, corpusLabel }) {
  const [metric, setMetric] = useState('corpus');

  const birKey = metric === 'corpus' ? 'total_corpus' : metric === 'words' ? 'total_words' : 'root_count';

  // ── Level 1: consonant frequency strips ──────────────────────────────────────
  const strips = useMemo(() => {
    const mkStrip = (rows) => {
      const maxVal = Math.max(...rows.map(r => r.val), 1);
      return { items: rows, maxVal };
    };

    // All positions aggregated
    const allMap = {};
    positions.forEach(p => {
      const v = p[metric] || 0;
      allMap[p.radical] = (allMap[p.radical] || 0) + v;
    });
    const allRows = Object.entries(allMap)
      .map(([rad, val]) => ({ rad, val, color: getColor(rad) }))
      .sort((a, b) => b.val - a.val).slice(0, 14);

    const byPos = pos => positions
      .filter(p => p.position === pos)
      .map(p => ({ rad: p.radical, val: p[metric] || 0, color: getColor(p.radical) }))
      .sort((a, b) => b.val - a.val).slice(0, 14);

    return {
      all: mkStrip(allRows),
      r1:  mkStrip(byPos('r1')),
      r2:  mkStrip(byPos('r2')),
      r3:  mkStrip(byPos('r3')),
    };
  }, [positions, metric]);

  // OCP signal
  const ocpRatio = useMemo(() => {
    let crossSum = 0, crossCt = 0, sameSum = 0, sameCt = 0;
    biradicals.forEach(d => {
      const [r1, r2] = d.pair_key.split('-');
      const c1 = PHON_CLASSES[r1]?.class, c2 = PHON_CLASSES[r2]?.class;
      if (!c1 || !c2) return;
      const val = d[birKey] || 0;
      if (c1 === c2) { sameSum += val; sameCt++; }
      else           { crossSum += val; crossCt++; }
    });
    if (!crossCt || !sameCt) return null;
    return ((crossSum / crossCt) / Math.max(sameSum / sameCt, 1)).toFixed(1);
  }, [biradicals, birKey]);

  // ── Level 2: top roots ────────────────────────────────────────────────────────
  const sortedRoots = useMemo(() => {
    if (!topRoots?.length) return [];
    const key = metric === 'roots' ? 'corpus' : metric;
    return [...topRoots].sort((a, b) => (b[key] || 0) - (a[key] || 0)).slice(0, 16);
  }, [topRoots, metric]);

  // ── Level 3: top families ─────────────────────────────────────────────────────
  const { byActive, byRoots, byDepth } = useMemo(() => ({
    byActive: [...biradicals].sort((a, b) => b.total_corpus - a.total_corpus).slice(0, 7),
    byRoots:  [...biradicals].sort((a, b) => b.root_count   - a.root_count  ).slice(0, 7),
    byDepth:  [...depths    ].sort((a, b) => b.r3_count     - a.r3_count    ).slice(0, 7),
  }), [biradicals, depths]);

  const sHdr = { color: '#2a2a2a', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 };
  const div  = { borderTop: '1px solid rgba(255,255,255,0.04)', margin: '12px 0' };

  return (
    <div style={{
      width: '100%', height: '100%', overflowY: 'auto', padding: '10px 14px 18px',
      boxSizing: 'border-box', scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent',
    }}>

      {/* header + metric toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: '#222', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {corpusLabel || 'All Corpora'}
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {METRIC_OPTS.map(([k, lbl]) => (
            <button key={k} onClick={() => setMetric(k)} style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 9, cursor: 'pointer',
              background: metric === k ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: `1px solid ${metric === k ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
              color: metric === k ? '#fff' : '#333',
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* ── I · Sounds ─────────────────────────────────────────────────────────── */}
      <div style={sHdr}>I · Sounds</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'all',   data: strips.all },
          { label: 'r1 →',  data: strips.r1  },
          { label: '· r2 ·', data: strips.r2  },
          { label: '→ r3',  data: strips.r3  },
        ].map(({ label, data }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#222', fontSize: 8, minWidth: 34, flexShrink: 0 }}>{label}</span>
            <ConsonantStrip items={data.items} maxVal={data.maxVal} />
          </div>
        ))}
      </div>
      {ocpRatio && (
        <div style={{ marginTop: 7, color: '#222', fontSize: 9 }}>
          cross-class: <span style={{ color: '#22c55e' }}>{ocpRatio}×</span> higher per pair than same-class · OCP active
        </div>
      )}

      <div style={div} />

      {/* ── II · Roots ─────────────────────────────────────────────────────────── */}
      <div style={sHdr}>II · Roots</div>
      {sortedRoots.length > 0 ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {sortedRoots.map(r => (
            <span key={`${r.r1}-${r.r2}-${r.r3}`} style={{
              fontSize: 12, fontFamily: 'serif',
              color: getColor(r.r1),
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '2px 8px', borderRadius: 4,
            }}>
              {r.r1}-{r.r2}-{r.r3}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ color: '#1f1f1f', fontSize: 9, fontStyle: 'italic' }}>loading…</div>
      )}

      <div style={div} />

      {/* ── III · Families ─────────────────────────────────────────────────────── */}
      <div style={sHdr}>III · Families</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>

        <FamilyCol title="most active" items={byActive.map(d => ({
          key: d.pair_key, sub: `${(d.total_corpus/1000).toFixed(1)}k`,
        }))} />

        <FamilyCol title="most productive" items={byRoots.map(d => ({
          key: d.pair_key, sub: `${d.root_count} roots`,
        }))} />

        <FamilyCol title="deepest r3" items={byDepth.map(d => ({
          key: d.pair_key, sub: `${d.r3_count}/28`,
        }))} />

      </div>

    </div>
  );
}

function FamilyCol({ title, items }) {
  return (
    <div>
      <div style={{ color: '#1f1f1f', fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>
        {title}
      </div>
      {items.map(({ key, sub }) => {
        const [r1] = key.split('-');
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontFamily: 'serif', color: getColor(r1), minWidth: 26 }}>{key}</span>
            <span style={{ color: '#2a2a2a', fontSize: 8 }}>{sub}</span>
          </div>
        );
      })}
    </div>
  );
}
