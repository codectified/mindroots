import { useMemo, useState, useEffect, useCallback } from 'react';
import { PHON_CLASSES, CLASS_META, PHONETIC_META } from './phonology';

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASS_ORDER = ['guttural', 'dorsal', 'emphatic', 'coronal', 'labial'];
const MANNER_ORDER = ['plosive', 'nasal', 'trill', 'lateral', 'affricate', 'fricative', 'semivowel'];
const MANNER_LABEL = {
  plosive: 'Stop', fricative: 'Fricative', nasal: 'Nasal',
  lateral: 'Lateral', trill: 'Trill', affricate: 'Affricate', semivowel: 'Semivowel',
};
const ALL_CONSONANTS = Object.keys(PHON_CLASSES);

const SORT_OPTS = {
  sound:  [['corpus','gravity'],['class','class'],['manner','manner'],['voicing','voice'],['alpha','A-Z']],
  family: [['corpus','active'],['roots','prolific'],['depth','deep'],['class','class']],
  root:   [['corpus','gravity'],['words','fertile']],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const clsColor = rad => CLASS_META[PHON_CLASSES[rad]?.class]?.color || '#555';
const clsLabel = rad => CLASS_META[PHON_CLASSES[rad]?.class]?.label || '';

function buildSoundStory(rad, posStats, nFamiliesR1) {
  const phon = PHONETIC_META[rad];
  const total = (posStats.r1 || 0) + (posStats.r2 || 0) + (posStats.r3 || 0) || 1;
  const r1pct = Math.round((posStats.r1 || 0) / total * 100);
  const role = r1pct >= 45 ? `a morphological initiator — ${r1pct}% of its corpus weight opens roots`
             : r1pct <= 28 ? `a morphological follower, carrying most weight in middle and final positions`
             : `positionally versatile, distributed across all three root slots`;
  const phonLabel = phon
    ? `${phon.voicing} ${phon.emphatic ? 'emphatic ' : ''}${MANNER_LABEL[phon.manner] || phon.manner} at the ${phon.place}`
    : '';
  const cls = clsLabel(rad);
  const pairNote = phon?.pair
    ? ` Its natural acoustic counterpart is ${phon.pair} — the ${phon.voicing === 'voiced' ? 'voiceless' : phon.emphatic ? 'plain' : 'voiced'} partner at the same place of articulation.`
    : '';
  return `${rad} is a ${phonLabel}${cls ? `, in the ${cls} class` : ''}. As a root consonant it is ${role}, anchoring ${nFamiliesR1} bi-radical families as r1.${pairNote}`;
}

function buildFamilyStory(pairKey, biral, r3Count) {
  const [r1, r2] = pairKey.split('-');
  const c1 = clsLabel(r1), c2 = clsLabel(r2);
  const sameClass = PHON_CLASSES[r1]?.class === PHON_CLASSES[r2]?.class;
  const ocpNote = sameClass
    ? ' As a same-class pair it is an OCP exception — phonotactically marked and relatively rare.'
    : '';
  const weight = biral.total_corpus > 50000 ? 'a high-gravity family'
               : biral.total_corpus > 5000  ? 'a moderately active family'
               : 'a quiet, specialized family';
  return `${pairKey} joins ${c1} with ${c2}, yielding ${biral.root_count} roots elaborated across ${r3Count} of 28 possible r3 consonants. It is ${weight} with ${biral.total_corpus.toLocaleString()} corpus occurrences.${ocpNote}`;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHdr({ children }) {
  return (
    <div style={{ color: '#222', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 4, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return <div style={{ marginBottom: 18 }}><SectionHdr>{title}</SectionHdr>{children}</div>;
}

function Chip({ children, color }) {
  return (
    <span style={{
      fontSize: 12, fontFamily: 'serif', color: color || '#eab308',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
      padding: '2px 8px', borderRadius: 4, display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

function StatRow({ label, val, maxVal, color }) {
  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ color: '#2a2a2a', fontSize: 9, minWidth: 20 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, opacity: 0.7, borderRadius: 2 }} />
      </div>
      <span style={{ color, fontSize: 9, minWidth: 52, textAlign: 'right', opacity: 0.8 }}>
        {val.toLocaleString()}
      </span>
    </div>
  );
}

// ── Hero glyph block ──────────────────────────────────────────────────────────

function HeroGlyph({ rad, size = 88 }) {
  const color = clsColor(rad);
  return (
    <span style={{
      fontSize: size, fontFamily: 'serif', color, lineHeight: 1,
      textShadow: `0 0 60px ${color}50, 0 0 120px ${color}18`,
    }}>{rad}</span>
  );
}

// ── Sound Profile ─────────────────────────────────────────────────────────────

function SoundProfile({ rad, positions, biradicals }) {
  const color = clsColor(rad);
  const phon  = PHONETIC_META[rad];

  const posStats = useMemo(() => {
    const s = { r1: 0, r2: 0, r3: 0 };
    positions.forEach(p => { if (p.radical === rad) s[p.position] = p.corpus; });
    return s;
  }, [rad, positions]);

  const allCorpus = posStats.r1 + posStats.r2 + posStats.r3;

  const r1Families = useMemo(() =>
    biradicals.filter(d => d.pair_key.startsWith(rad + '-'))
              .sort((a, b) => b.total_corpus - a.total_corpus).slice(0, 12),
    [rad, biradicals]);

  const r2Partners = useMemo(() =>
    biradicals.filter(d => d.pair_key.endsWith('-' + rad))
              .sort((a, b) => b.total_corpus - a.total_corpus).slice(0, 12),
    [rad, biradicals]);

  const story = useMemo(() => buildSoundStory(rad, posStats, r1Families.length), [rad, posStats, r1Families]);

  const pairRad   = phon?.pair;
  const pairColor = pairRad ? clsColor(pairRad) : null;
  const pairPhon  = pairRad ? PHONETIC_META[pairRad] : null;

  return (
    <div style={{ padding: '14px 20px 28px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '20px 0 14px' }}>
        <HeroGlyph rad={rad} size={92} />
        {phon && (
          <div style={{ color: '#3a3a3a', fontSize: 10, marginTop: 8, letterSpacing: '0.05em' }}>
            {phon.voicing}{phon.emphatic ? ' emphatic' : ''} {MANNER_LABEL[phon.manner] || phon.manner} · {phon.place}
          </div>
        )}
        <div style={{ marginTop: 5 }}>
          <span style={{ background: color + '22', border: `1px solid ${color}40`, color, fontSize: 9, padding: '2px 10px', borderRadius: 10, letterSpacing: '0.06em' }}>
            {clsLabel(rad)}
          </span>
        </div>
      </div>

      {/* Corpus weight */}
      <Section title="Corpus Weight">
        <StatRow label="all" val={allCorpus}   maxVal={allCorpus}   color={color} />
        <StatRow label="r1"  val={posStats.r1} maxVal={allCorpus}   color={color} />
        <StatRow label="r2"  val={posStats.r2} maxVal={allCorpus}   color={color} />
        <StatRow label="r3"  val={posStats.r3} maxVal={allCorpus}   color={color} />
      </Section>

      {/* Phonetic pair */}
      {pairRad && (
        <Section title={phon.emphatic ? 'Emphatic / Plain Pair' : 'Voiced / Voiceless Pair'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontFamily: 'serif', color, lineHeight: 1, textShadow: `0 0 30px ${color}40` }}>{rad}</div>
              <div style={{ color: '#2a2a2a', fontSize: 8, marginTop: 4 }}>{phon.voicing}{phon.emphatic ? ' · emphatic' : ''}</div>
            </div>
            <div style={{ color: '#1a1a1a', fontSize: 20 }}>↔</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontFamily: 'serif', color: pairColor, lineHeight: 1, textShadow: `0 0 30px ${pairColor}40` }}>{pairRad}</div>
              <div style={{ color: '#2a2a2a', fontSize: 8, marginTop: 4 }}>{pairPhon?.voicing}{phon.emphatic ? ' · plain' : ''}</div>
            </div>
            <div style={{ color: '#2a2a2a', fontSize: 9, marginLeft: 8, lineHeight: 1.6 }}>
              {phon.place}<br/>
              {MANNER_LABEL[phon.manner] || phon.manner}
            </div>
          </div>
        </Section>
      )}

      {/* Families as r1 */}
      {r1Families.length > 0 && (
        <Section title={`Families Anchored (r1) · ${r1Families.length}`}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {r1Families.map(d => {
              const [, r2] = d.pair_key.split('-');
              return <Chip key={d.pair_key} color={clsColor(r2)}>{d.pair_key}</Chip>;
            })}
          </div>
        </Section>
      )}

      {/* Families as r2 */}
      {r2Partners.length > 0 && (
        <Section title={`Appears as r2 · ${r2Partners.length} families`}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {r2Partners.map(d => {
              const [r1] = d.pair_key.split('-');
              return <Chip key={d.pair_key} color={clsColor(r1)}>{d.pair_key}</Chip>;
            })}
          </div>
        </Section>
      )}

      {/* Story */}
      <Section title="Story">
        <p style={{ color: '#444', fontSize: 10, lineHeight: 1.8, margin: 0 }}>{story}</p>
      </Section>

    </div>
  );
}

// ── Family Profile ────────────────────────────────────────────────────────────

function FamilyProfile({ pairKey, biradicals, depths, topRoots }) {
  const [r1, r2]  = pairKey.split('-');
  const c1Color   = clsColor(r1), c2Color = clsColor(r2);
  const c1Label   = clsLabel(r1), c2Label = clsLabel(r2);
  const biral     = biradicals.find(d => d.pair_key === pairKey);
  const depth     = depths.find(d => d.pair_key === pairKey);
  const r3Set     = useMemo(() => new Set(depth?.r3_values || []), [depth]);

  const topInFamily = useMemo(() =>
    topRoots.filter(r => r.r1 === r1 && r.r2 === r2).sort((a, b) => b.corpus - a.corpus),
    [pairKey, topRoots]);

  const story = useMemo(() =>
    biral ? buildFamilyStory(pairKey, biral, r3Set.size) : '',
    [pairKey, biral, r3Set.size]);

  return (
    <div style={{ padding: '14px 20px 28px' }}>

      {/* Hero pair */}
      <div style={{ textAlign: 'center', padding: '20px 0 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 84, fontFamily: 'serif', color: c1Color, lineHeight: 1, textShadow: `0 0 60px ${c1Color}45` }}>{r1}</span>
          <span style={{ fontSize: 36, color: '#1f1f1f', fontWeight: 300, alignSelf: 'center' }}>—</span>
          <span style={{ fontSize: 84, fontFamily: 'serif', color: c2Color, lineHeight: 1, textShadow: `0 0 60px ${c2Color}45` }}>{r2}</span>
        </div>
        <div style={{ color: '#333', fontSize: 10, marginTop: 6, letterSpacing: '0.04em' }}>
          <span style={{ color: c1Color }}>{c1Label}</span>
          <span style={{ color: '#1f1f1f' }}> × </span>
          <span style={{ color: c2Color }}>{c2Label}</span>
        </div>
      </div>

      {/* Stats */}
      {biral && (
        <Section title="Family Stats">
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Stat val={biral.root_count} color="#a855f7" label="roots" />
            <Stat val={`${(biral.total_corpus / 1000).toFixed(1)}k`} color="#ef4444" label="corpus" />
            <Stat val={`${(biral.total_words / 1000).toFixed(1)}k`} color="#22c55e" label="words" />
            {depth && <Stat val={`${depth.r3_count}/28`} color="#eab308" label="r3 depth" />}
          </div>
        </Section>
      )}

      {/* All root members from depths */}
      {depth?.r3_values?.length > 0 && (
        <Section title={`Root Members · ${depth.r3_values.length} roots`}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[...depth.r3_values].map(r3 => (
              <Chip key={r3} color={clsColor(r3)}>{r1}-{r2}-{r3}</Chip>
            ))}
          </div>
        </Section>
      )}

      {/* r3 depth by phonological class */}
      {depth?.r3_values?.length > 0 && (
        <Section title="r3 Depth by Class">
          {CLASS_ORDER.map(cls => {
            const members = ALL_CONSONANTS.filter(c => PHON_CLASSES[c]?.class === cls);
            const color   = CLASS_META[cls]?.color || '#555';
            return (
              <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#1f1f1f', fontSize: 8, minWidth: 52, textAlign: 'right' }}>
                  {CLASS_META[cls]?.label}
                </span>
                <div style={{ display: 'flex', gap: 5 }}>
                  {members.map(c => (
                    <span key={c} style={{
                      fontSize: 14, fontFamily: 'serif',
                      color: r3Set.has(c) ? color : '#181818',
                      textShadow: r3Set.has(c) ? `0 0 10px ${color}60` : 'none',
                      transition: 'color 0.15s',
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {/* Top roots from topRoots data (with corpus stats) */}
      {topInFamily.length > 0 && (
        <Section title={`Top Roots by Corpus · ${topInFamily.length} shown`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {topInFamily.map(r => (
              <div key={`${r.r1}-${r.r2}-${r.r3}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Chip color={clsColor(r.r3)}>{r.r1}-{r.r2}-{r.r3}</Chip>
                <span style={{ color: '#ef4444', fontSize: 9 }}>{r.corpus.toLocaleString()}</span>
                <span style={{ color: '#22c55e', fontSize: 9 }}>{r.words.toLocaleString()} words</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Story */}
      <Section title="Story">
        <p style={{ color: '#444', fontSize: 10, lineHeight: 1.8, margin: 0 }}>{story}</p>
      </Section>

    </div>
  );
}

// ── Root Profile ──────────────────────────────────────────────────────────────

function RootProfile({ root }) {
  const { r1, r2, r3, corpus, words } = root;
  const [c1, c2, c3] = [r1, r2, r3].map(r => CLASS_META[PHON_CLASSES[r]?.class]);

  return (
    <div style={{ padding: '14px 20px 28px' }}>
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6 }}>
          {[[r1, c1],[r2, c2],[r3, c3]].map(([rad, meta], i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              {i > 0 && <span style={{ fontSize: 26, color: '#1f1f1f' }}>-</span>}
              <span style={{ fontSize: 74, fontFamily: 'serif', color: meta?.color || '#eab308', lineHeight: 1, textShadow: `0 0 50px ${meta?.color || '#eab308'}40` }}>
                {rad}
              </span>
            </span>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 5, justifyContent: 'center' }}>
          {[c1, c2, c3].filter(Boolean).map((c, i) => (
            <span key={i} style={{ background: c.color + '20', border: `1px solid ${c.color}40`, color: c.color, fontSize: 8, padding: '2px 8px', borderRadius: 10 }}>
              {c.label}
            </span>
          ))}
        </div>
      </div>
      <Section title="Corpus Weight">
        <div style={{ display: 'flex', gap: 24 }}>
          <Stat val={corpus?.toLocaleString()} color="#ef4444" label="corpus" />
          <Stat val={words?.toLocaleString()}  color="#22c55e" label="words"  />
        </div>
      </Section>
    </div>
  );
}

// ── Stat display helper ───────────────────────────────────────────────────────

function Stat({ val, color, label }) {
  return (
    <div>
      <div style={{ color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{val}</div>
      <div style={{ color: '#2a2a2a', fontSize: 8, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Main ProfileBrowser ───────────────────────────────────────────────────────

export default function ProfileBrowser({ biradicals, positions, depths, topRoots, corpusLabel }) {
  const [type,        setType]        = useState('sound');
  const [sort,        setSort]        = useState('corpus');
  const [selectedKey, setSelectedKey] = useState(null);

  // Reset on type change
  useEffect(() => { setSort('corpus'); setSelectedKey(null); }, [type]);

  // Corpus totals per sound
  const soundCorpus = useMemo(() => {
    const m = {};
    positions.forEach(p => { m[p.radical] = (m[p.radical] || 0) + p.corpus; });
    return m;
  }, [positions]);

  // Depth map for families
  const depthMap = useMemo(() => {
    const m = {};
    depths.forEach(d => { m[d.pair_key] = d.r3_count; });
    return m;
  }, [depths]);

  // Build entity list
  const entities = useMemo(() => {
    if (type === 'sound') {
      return ALL_CONSONANTS
        .sort((a, b) => {
          if (sort === 'corpus')  return (soundCorpus[b] || 0) - (soundCorpus[a] || 0);
          if (sort === 'class')   return CLASS_ORDER.indexOf(PHON_CLASSES[a]?.class) - CLASS_ORDER.indexOf(PHON_CLASSES[b]?.class);
          if (sort === 'manner')  return MANNER_ORDER.indexOf(PHONETIC_META[a]?.manner) - MANNER_ORDER.indexOf(PHONETIC_META[b]?.manner);
          if (sort === 'voicing') return (PHONETIC_META[a]?.voicing === 'voiced' ? 0 : 1) - (PHONETIC_META[b]?.voicing === 'voiced' ? 0 : 1);
          return 0; // alpha fallback
        })
        .map(r => ({ key: r, label: r, color: clsColor(r), val: soundCorpus[r] || 0 }));
    }
    if (type === 'family') {
      return biradicals
        .sort((a, b) => {
          if (sort === 'corpus') return b.total_corpus - a.total_corpus;
          if (sort === 'roots')  return b.root_count   - a.root_count;
          if (sort === 'depth')  return (depthMap[b.pair_key] || 0) - (depthMap[a.pair_key] || 0);
          if (sort === 'class') {
            const [ar1] = a.pair_key.split('-'), [br1] = b.pair_key.split('-');
            return CLASS_ORDER.indexOf(PHON_CLASSES[ar1]?.class) - CLASS_ORDER.indexOf(PHON_CLASSES[br1]?.class);
          }
          return 0;
        })
        .slice(0, 150)
        .map(d => {
          const [r1] = d.pair_key.split('-');
          return { key: d.pair_key, label: d.pair_key, color: clsColor(r1), val: d.total_corpus };
        });
    }
    if (type === 'root') {
      return [...topRoots]
        .sort((a, b) => sort === 'words' ? b.words - a.words : b.corpus - a.corpus)
        .map(r => ({
          key:   `${r.r1}-${r.r2}-${r.r3}`,
          label: `${r.r1}-${r.r2}-${r.r3}`,
          color: clsColor(r.r1),
          val:   r.corpus,
        }));
    }
    return [];
  }, [type, sort, soundCorpus, depthMap, biradicals, topRoots]);

  // Auto-select first on list change
  useEffect(() => {
    if (entities.length > 0) setSelectedKey(entities[0].key);
  }, [entities]);

  // Keyboard navigation
  const handleKey = useCallback(e => {
    if (!['ArrowDown','ArrowUp'].includes(e.key)) return;
    const idx = entities.findIndex(en => en.key === selectedKey);
    if (e.key === 'ArrowDown' && idx < entities.length - 1) { e.preventDefault(); setSelectedKey(entities[idx + 1].key); }
    if (e.key === 'ArrowUp'   && idx > 0)                  { e.preventDefault(); setSelectedKey(entities[idx - 1].key); }
  }, [entities, selectedKey]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const maxVal   = useMemo(() => Math.max(...entities.map(e => e.val), 1), [entities]);
  const selEntity = entities.find(e => e.key === selectedKey);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div style={{ width: 164, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>

        {/* Corpus label */}
        {corpusLabel && (
          <div style={{ padding: '4px 8px', color: '#222', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.03)', flexShrink: 0 }}>
            {corpusLabel}
          </div>
        )}

        {/* Type tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          {['sound','family','root'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '6px 0', fontSize: 8, cursor: 'pointer', border: 'none',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: type === t ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: type === t ? '#ccc' : '#2a2a2a',
              borderBottom: `1px solid ${type === t ? 'rgba(255,255,255,0.18)' : 'transparent'}`,
            }}>{t}</button>
          ))}
        </div>

        {/* Sort chips */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', padding: '5px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          {(SORT_OPTS[type] || []).map(([k, lbl]) => (
            <button key={k} onClick={() => setSort(k)} style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 7, cursor: 'pointer',
              background: sort === k ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: `1px solid ${sort === k ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)'}`,
              color: sort === k ? '#ccc' : '#2a2a2a',
            }}>{lbl}</button>
          ))}
        </div>

        {/* Entity list */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
          {entities.map(en => {
            const isSel = en.key === selectedKey;
            const barW  = Math.max(2, Math.round((en.val / maxVal) * 38));
            const fontSize = type === 'root' ? 9 : type === 'family' ? 11 : 15;
            return (
              <div key={en.key} onClick={() => setSelectedKey(en.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                cursor: 'pointer', userSelect: 'none',
                background: isSel ? 'rgba(255,255,255,0.07)' : 'transparent',
                borderLeft: `2px solid ${isSel ? en.color : 'transparent'}`,
              }}>
                <span style={{
                  fontFamily: 'serif', fontSize,
                  color: isSel ? en.color : en.color + '88',
                  minWidth: type === 'root' ? 56 : type === 'family' ? 28 : 16,
                  lineHeight: 1.3,
                }}>{en.label}</span>
                <div style={{ width: barW, height: 2, background: en.color, opacity: isSel ? 0.8 : 0.25, borderRadius: 1, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Profile panel ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
        {!selEntity && (
          <div style={{ padding: 24, color: '#1f1f1f', fontSize: 10 }}>select an entity from the list</div>
        )}
        {selEntity && type === 'sound' && (
          <SoundProfile rad={selectedKey} positions={positions} biradicals={biradicals} />
        )}
        {selEntity && type === 'family' && (
          <FamilyProfile pairKey={selectedKey} biradicals={biradicals} depths={depths} topRoots={topRoots} />
        )}
        {selEntity && type === 'root' && (() => {
          const root = topRoots.find(r => `${r.r1}-${r.r2}-${r.r3}` === selectedKey);
          return root ? <RootProfile root={root} /> : null;
        })()}
      </div>

    </div>
  );
}
