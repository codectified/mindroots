import { useEffect, useState } from 'react';
import { fetchCorpora, fetchBiradicals, fetchProjection } from '../../services/apiService';
import { PHON_CLASSES } from '../analytics/phonology';
import BranchSnapshot from '../analytics/BranchSnapshot';
import SnapshotFingerprint from '../analytics/SnapshotFingerprint';
import MorphologicalFlow from '../analytics/MorphologicalFlow';
import LexiconCloud from '../analytics/LexiconCloud';

const RADICALS = Object.keys(PHON_CLASSES);

const selectStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 5, padding: '3px 8px', fontSize: 12, color: '#ccc', outline: 'none',
};

// Projection Lab: experimental frontend for the Projection Snapshot API.
// Center + Scope + Projection Rule -> Shape. This page renders whatever
// shape comes back — it owns no chart-specific state, unlike /analytics.
export default function ProjectionLab() {
  const [corpora,  setCorpora]  = useState([]);
  const [corpusId, setCorpusId] = useState('all');
  const [surah,    setSurah]    = useState(null);
  const isQuran = corpusId === '2';

  const [centerType, setCenterType] = useState('radical'); // 'radical' | 'biradical'
  const [radical, setRadical]       = useState('ك');
  const [pairKey, setPairKey]       = useState('');
  const [pairOptions, setPairOptions] = useState([]);

  const [snapshot, setSnapshot] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [view,     setView]     = useState('universe'); // 'universe' | 'fingerprint' | 'data'

  useEffect(() => {
    fetchCorpora().then(d => setCorpora(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => { if (!isQuran) setSurah(null); }, [isQuran]);

  // bi-radical center options come from the existing biradicals endpoint,
  // scoped to the currently selected corpus — no hardcoded pair list.
  useEffect(() => {
    fetchBiradicals(corpusId, surah)
      .then(d => {
        const keys = (d.biradicals || []).map(b => b.pair_key).sort();
        setPairOptions(keys);
        setPairKey(prev => (keys.includes(prev) ? prev : (keys[0] || '')));
      })
      .catch(() => setPairOptions([]));
  }, [corpusId, surah]);

  const center     = centerType === 'radical' ? radical : pairKey;
  const projection = centerType === 'radical' ? 'by_position' : 'r3_completions';

  useEffect(() => {
    if (!center) return;
    setLoading(true);
    setError(null);
    fetchProjection({ centerType, center, projection, corpusId, surah })
      .then(setSnapshot)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [centerType, center, projection, corpusId, surah]);

  // Called when the universe view is clicked into — recentering reuses the
  // exact same state that drives the dropdowns, so the two stay in sync and
  // the dropdowns effectively become a breadcrumb of where you are.
  const handleRecenter = ({ centerType: nextType, center: nextCenter }) => {
    setCenterType(nextType);
    if (nextType === 'biradical') setPairKey(nextCenter);
    if (nextType === 'radical') setRadical(nextCenter);
  };

  const btn = active => ({
    padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
    background: active ? 'rgba(168,85,247,0.18)' : 'transparent',
    border: `1px solid ${active ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
    color: active ? '#a855f7' : '#555',
  });

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <span style={{ color: '#333', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Projection Lab</span>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={btn(centerType === 'radical')} onClick={() => setCenterType('radical')}>radical → position</button>
            <button style={btn(centerType === 'biradical')} onClick={() => setCenterType('biradical')}>bi-radical → r3</button>
          </div>

          {centerType === 'radical' ? (
            <select value={radical} onChange={e => setRadical(e.target.value)} style={selectStyle}>
              {RADICALS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          ) : (
            <select value={pairKey} onChange={e => setPairKey(e.target.value)} style={selectStyle}>
              {pairOptions.length === 0 && <option value="">no pairs in scope</option>}
              {pairOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: '#333', fontSize: 10 }}>scope:</span>
          {[{ id: 'all', english: 'Entire lexicon' }, ...corpora].map(c => (
            <button key={c.id} onClick={() => { setCorpusId(String(c.id)); setSurah(null); }} style={btn(corpusId === String(c.id))}>
              {c.english || c.arabic || `Corpus ${c.id}`}
            </button>
          ))}
          {isQuran && (
            <input
              type="number" min={1} max={114} placeholder="surah #"
              value={surah || ''}
              onChange={e => setSurah(e.target.value || null)}
              style={{ ...selectStyle, width: 70 }}
            />
          )}
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button style={btn(view === 'landscape')} onClick={() => setView('landscape')}>landscape</button>
            <button style={btn(view === 'universe')} onClick={() => setView('universe')}>universe</button>
            <button style={btn(view === 'fingerprint')} onClick={() => setView('fingerprint')}>fingerprint</button>
            <button style={btn(view === 'data')} onClick={() => setView('data')}>raw data</button>
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {/* landscape is the whole-lexicon base map — independent of the per-center
            projection fetch, so it renders regardless of that request's state */}
        {view === 'landscape' && (
          <LexiconCloud
            highlightRadical={centerType === 'radical' ? radical : null}
            corpusId={corpusId}
            surah={surah}
          />
        )}
        {view !== 'landscape' && loading && <Centered><span style={{ color: '#333' }}>loading…</span></Centered>}
        {view !== 'landscape' && error && <Centered><span style={{ color: '#ef4444' }}>{error}</span></Centered>}
        {!loading && !error && view === 'universe' && <MorphologicalFlow snapshot={snapshot} onRecenter={handleRecenter} />}
        {!loading && !error && view === 'fingerprint' && <SnapshotFingerprint snapshot={snapshot} />}
        {!loading && !error && view === 'data' && <BranchSnapshot snapshot={snapshot} />}
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
