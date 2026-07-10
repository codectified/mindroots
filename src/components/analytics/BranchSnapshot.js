import { useMemo, useState } from 'react';
import { PHON_CLASSES } from './phonology';

const METRICS = [
  { key: 'roots',  label: 'roots' },
  { key: 'words',  label: 'words' },
  { key: 'corpus', label: 'corpus gravity' },
];

// Generic renderer for a Projection Snapshot: { center, scope, projection, branches, meta }.
// Layout (this bar list, or eventually radial/tree/mandala) is a view of the snapshot,
// not the snapshot itself — the shape of the data doesn't change with the layout.
export default function BranchSnapshot({ snapshot }) {
  const [metric, setMetric]     = useState('corpus');
  const [expanded, setExpanded] = useState(null);

  const sorted = useMemo(
    () => [...(snapshot?.branches || [])].sort((a, b) => (b[metric] || 0) - (a[metric] || 0)),
    [snapshot, metric]
  );
  const maxVal = useMemo(
    () => Math.max(1, ...sorted.map(b => b[metric] || 0)),
    [sorted, metric]
  );

  if (!snapshot) {
    return <Centered><span style={{ color: '#333' }}>choose a center to project</span></Centered>;
  }

  const { center, scope, projection, meta } = snapshot;

  if (sorted.length === 0) {
    return (
      <Centered>
        <div style={{ textAlign: 'center', color: '#444' }}>
          <div style={{ fontSize: 28, fontFamily: 'serif', direction: 'rtl', color: '#eab308', marginBottom: 8 }}>{center?.label}</div>
          <div>no branches in this scope — measurable absence</div>
        </div>
      </Centered>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 16px', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 26, fontFamily: 'serif', direction: 'rtl', color: '#eab308' }}>{center?.label}</span>
        <span style={{ color: '#555', fontSize: 12 }}>{scope?.label}</span>
        <span style={{ color: '#333', fontSize: 11 }}>· {projection}</span>
        <span style={{ marginLeft: 'auto', color: '#444', fontSize: 11 }}>
          {meta?.total_branches} branches · {meta?.total_roots?.toLocaleString()} roots ·{' '}
          {meta?.total_words?.toLocaleString()} words · {meta?.total_corpus?.toLocaleString()} corpus
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', flexShrink: 0 }}>
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)} style={{
            padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: metric === m.key ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.15)', color: metric === m.key ? '#fff' : '#555',
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {sorted.map(b => {
          const isOpen = expanded === b.key;
          const barW   = Math.max(2, ((b[metric] || 0) / maxVal) * 100);
          const color  = PHON_CLASSES[b.key]?.color || '#a855f7';
          return (
            <div key={b.key} style={{ marginBottom: 6 }}>
              <div
                onClick={() => setExpanded(isOpen ? null : b.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}
              >
                <span style={{ width: 32, fontSize: 15, fontFamily: 'serif', direction: 'rtl', color, flexShrink: 0 }}>{b.label}</span>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 16, position: 'relative' }}>
                  <div style={{ width: `${barW}%`, height: '100%', background: color, opacity: 0.75, borderRadius: 4 }} />
                </div>
                <span style={{ width: 70, textAlign: 'right', fontSize: 11, color: '#888', flexShrink: 0 }}>
                  {(b[metric] || 0).toLocaleString()}
                </span>
              </div>
              {isOpen && (
                <div style={{ marginLeft: 42, marginTop: 4, marginBottom: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 11, color: '#888' }}>
                  <div style={{ marginBottom: 6, color: '#555' }}>
                    roots {b.roots.toLocaleString()} · words {b.words.toLocaleString()} · corpus {b.corpus.toLocaleString()}
                  </div>
                  {b.examples?.length ? b.examples.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '2px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontFamily: 'serif', direction: 'rtl', color: '#ccc', width: 90, flexShrink: 0 }}>
                        {ex.arabic || [ex.r1, ex.r2, ex.r3].filter(Boolean).join('')}
                      </span>
                      <span style={{ flex: 1, color: '#666' }}>{ex.english}</span>
                      <span style={{ color: '#444', flexShrink: 0 }}>{ex.corpus?.toLocaleString()}</span>
                    </div>
                  )) : <span style={{ color: '#333', fontStyle: 'italic' }}>no examples</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  );
}
