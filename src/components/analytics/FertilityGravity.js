import { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useSize } from './shared';
import { PHON_CLASSES, CLASS_META } from './phonology';

const ENTITIES = [
  { key: 'biradicals', label: 'Bi-radicals',       xLabel: 'Fertility — word forms',          yLabel: 'Gravity — corpus occurrences'  },
  { key: 'radicals',   label: 'Radicals',           xLabel: 'Fertility — words across roles',  yLabel: 'Gravity — corpus across roles' },
  { key: 'radpos',     label: 'Rad×Position',       xLabel: 'Fertility — words in position',   yLabel: 'Gravity — corpus in position'  },
  { key: 'roots',      label: 'Roots (per-root avg)', xLabel: 'Fertility — avg words per root', yLabel: 'Gravity — avg corpus per root' },
];

const SIZE_OPTS = [
  { key: 'roots',      label: 'root count'     },
  { key: 'formDiv',    label: 'form diversity' },
  { key: 'commitment', label: 'commitment'     },
  { key: 'density',    label: 'corpus density' },
];

const QUAD = {
  civilization: { label: 'Civilizations',  fill: 'rgba(234,179,8,0.055)',  text: 'rgba(234,179,8,0.22)'   },
  sacred:       { label: 'Sacred Cores',   fill: 'rgba(239,68,68,0.04)',   text: 'rgba(239,68,68,0.18)'   },
  factory:      { label: 'Word Factories', fill: 'rgba(34,197,94,0.04)',   text: 'rgba(34,197,94,0.18)'   },
  dormant:      { label: 'Dormant Seeds',  fill: 'rgba(80,80,100,0.035)', text: 'rgba(80,80,100,0.22)'   },
};

const getQ = (pt, xMed, yMed) =>
  pt.x_val >= xMed
    ? pt.y_val >= yMed ? 'civilization' : 'factory'
    : pt.y_val >= yMed ? 'sacred' : 'dormant';

function buildStory(pt, q, sizeKey) {
  const cls1    = PHON_CLASSES[pt.r1]?.class || '';
  const density = (pt.sizes.density || 0).toFixed(1);

  const core = {
    civilization: `${pt.id} is a morphological civilization — high fertility and high gravity in combination. It has generated ${pt.x_val.toLocaleString()} word forms and accumulated ${pt.y_val.toLocaleString()} corpus occurrences. These are the root families that built the active backbone of Arabic: prolific in derivation and dominant in actual usage.`,
    sacred:       `${pt.id} is a sacred core — modest in fertility, enormous in gravity. Just ${pt.x_val.toLocaleString()} word forms carry ${pt.y_val.toLocaleString()} corpus appearances. Each word from this family recurs far more than average, a signature of Quranic, liturgical, or jurisprudential vocabulary: the same foundational words, repeated across the entire text tradition.`,
    factory:      `${pt.id} is a word factory — high fertility, below-median gravity. ${pt.x_val.toLocaleString()} word forms derived from this family, yet corpus gravity stays modest at ${pt.y_val.toLocaleString()} occurrences. The family is morphologically productive but hasn't secured a dominant textual position. This often marks technical, literary, or specialized vocabulary.`,
    dormant:      `${pt.id} is a dormant seed — low fertility and low gravity. Only ${pt.x_val.toLocaleString()} words and ${pt.y_val.toLocaleString()} corpus appearances. This family occupies a phonological niche but hasn't been deeply elaborated. It may represent historically constrained roots, borrowed consonant combinations, or a narrow semantic domain that never expanded.`,
  }[q];

  const phonLine = cls1
    ? ` The initiating radical ${pt.r1} belongs to the ${cls1} phonological class — consonants sharing articulatory properties that influence positional behavior in root structure.`
    : '';

  const sizeLine = {
    roots:      ` Root count: ${pt.sizes.roots || 0} tri-literal completions anchor this family.`,
    formDiv:    ` Form diversity: ${(pt.sizes.formDiv || 0).toFixed(1)} — average number of derived word patterns per root.`,
    commitment: ` Commitment ratio: ${(pt.sizes.commitment || 0).toFixed(0)}% — the share of 28 possible r3 consonants that are actually attested as completions of this pair.`,
    density:    ` Corpus density: ${density}× — each word appears that many times on average in the corpus.`,
  }[sizeKey];

  return core + phonLine + sizeLine;
}

const btn = active => ({
  padding: '3px 9px', borderRadius: 6, fontSize: 10, cursor: 'pointer', flexShrink: 0,
  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
  border:     `1px solid ${active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)'}`,
  color:      active ? '#fff' : '#444',
});

export default function FertilityGravity({ biradicals, depths, positions }) {
  const [entity,  setEntity]  = useState('biradicals');
  const [sizeKey, setSizeKey] = useState('roots');
  const [clicked, setClicked] = useState(null);
  const [hovered, setHovered] = useState(null);
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const m = { top: 36, right: 128, bottom: 56, left: 66 };

  const commitMap = useMemo(() => {
    const map = {};
    depths.forEach(d => { map[d.pair_key] = d.r3_count; });
    return map;
  }, [depths]);

  const pts = useMemo(() => {
    if (entity === 'biradicals') {
      return biradicals
        .filter(d => d.total_words > 0 && d.total_corpus > 0)
        .map(d => {
          const [r1] = d.pair_key.split('-');
          return {
            id: d.pair_key, r1,
            x_val: d.total_words,
            y_val: d.total_corpus,
            sizes: {
              roots:      d.root_count,
              formDiv:    d.avg_forms || 0,
              commitment: ((commitMap[d.pair_key] || 0) / 28) * 100,
              density:    d.total_corpus / Math.max(d.total_words, 1),
            },
          };
        });
    }

    if (entity === 'radicals') {
      const g = {};
      positions.forEach(p => {
        if (!g[p.radical]) g[p.radical] = { words: 0, corpus: 0, roots: 0 };
        g[p.radical].words  += p.words;
        g[p.radical].corpus += p.corpus;
        g[p.radical].roots  += p.roots;
      });
      return Object.entries(g)
        .filter(([, v]) => v.words > 0 && v.corpus > 0)
        .map(([radical, v]) => ({
          id: radical, r1: radical,
          x_val: v.words,
          y_val: v.corpus,
          sizes: { roots: v.roots, formDiv: v.roots, commitment: 0, density: v.corpus / Math.max(v.words, 1) },
        }));
    }

    if (entity === 'radpos') {
      return positions
        .filter(p => p.words > 0 && p.corpus > 0)
        .map(p => ({
          id: `${p.radical}·${p.position}`, r1: p.radical,
          x_val: p.words,
          y_val: p.corpus,
          sizes: { roots: p.roots, formDiv: p.roots, commitment: 0, density: p.corpus / Math.max(p.words, 1) },
        }));
    }

    if (entity === 'roots') {
      return biradicals
        .filter(d => d.total_words > 0 && d.total_corpus > 0 && d.root_count > 0)
        .map(d => {
          const [r1] = d.pair_key.split('-');
          return {
            id: d.pair_key, r1,
            x_val: Math.max(1, Math.round(d.total_words  / d.root_count)),
            y_val: Math.max(1, Math.round(d.total_corpus / d.root_count)),
            sizes: {
              roots:      d.root_count,
              formDiv:    d.avg_forms || 0,
              commitment: ((commitMap[d.pair_key] || 0) / 28) * 100,
              density:    d.total_corpus / Math.max(d.total_words, 1),
            },
          };
        });
    }

    return [];
  }, [entity, biradicals, positions, commitMap]);

  const xMax   = useMemo(() => d3.max(pts, d => d.x_val) || 1, [pts]);
  const yMax   = useMemo(() => d3.max(pts, d => d.y_val) || 1, [pts]);
  const xScale = useMemo(() => w > 0 ? d3.scaleLog().domain([1, xMax]).range([m.left, w - m.right]).nice() : null, [xMax, w]); // eslint-disable-line
  const yScale = useMemo(() => h > 0 ? d3.scaleLog().domain([1, yMax]).range([h - m.bottom, m.top]).nice() : null, [yMax, h]); // eslint-disable-line

  const sizeMax = useMemo(() => d3.max(pts, d => d.sizes[sizeKey] || 0) || 1, [pts, sizeKey]);
  const rScale  = useMemo(() => d3.scaleSqrt().domain([0, sizeMax]).range([3, 18]), [sizeMax]);

  const xMedian = useMemo(() => {
    const vals = pts.map(d => d.x_val).sort((a, b) => a - b);
    return vals.length ? vals[Math.floor(vals.length / 2)] : 1;
  }, [pts]);
  const yMedian = useMemo(() => {
    const vals = pts.map(d => d.y_val).sort((a, b) => a - b);
    return vals.length ? vals[Math.floor(vals.length / 2)] : 1;
  }, [pts]);

  const outlierSet = useMemo(() => {
    const N = 5;
    const pick = fn => [...pts].sort(fn).slice(0, N).map(d => d.id);
    return new Set([
      ...pick((a, b) => b.x_val                               - a.x_val),
      ...pick((a, b) => b.y_val                               - a.y_val),
      ...pick((a, b) => (b.sizes.density  || 0) - (a.sizes.density  || 0)),
      ...pick((a, b) => (b.sizes.roots    || 0) - (a.sizes.roots    || 0)),
      ...pick((a, b) => (b.sizes.formDiv  || 0) - (a.sizes.formDiv  || 0)),
    ]);
  }, [pts]);

  const story    = useMemo(
    () => clicked ? buildStory(clicked, getQ(clicked, xMedian, yMedian), sizeKey) : null,
    [clicked, xMedian, yMedian, sizeKey],
  );
  const clickedQ = clicked ? getQ(clicked, xMedian, yMedian) : null;

  const entityMeta = ENTITIES.find(e => e.key === entity) || ENTITIES[0];

  const xDiv = xScale && xMedian > 1
    ? xScale(Math.max(xScale.domain()[0], Math.min(xScale.domain()[1], xMedian)))
    : null;
  const yDiv = yScale && yMedian > 1
    ? yScale(Math.max(yScale.domain()[0], Math.min(yScale.domain()[1], yMedian)))
    : null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* controls */}
      <div style={{
        display: 'flex', gap: 5, padding: '5px 10px', flexShrink: 0,
        flexWrap: 'wrap', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ color: '#333', fontSize: 10 }}>entity:</span>
        {ENTITIES.map(e => (
          <button key={e.key} onClick={() => { setEntity(e.key); setClicked(null); }} style={btn(entity === e.key)}>
            {e.label}
          </button>
        ))}
        <span style={{ color: '#222', margin: '0 3px' }}>|</span>
        <span style={{ color: '#333', fontSize: 10 }}>size:</span>
        {SIZE_OPTS.map(s => (
          <button key={s.key} onClick={() => setSizeKey(s.key)} style={btn(sizeKey === s.key)}>
            {s.label}
          </button>
        ))}
        {clicked && (
          <button onClick={() => setClicked(null)}
            style={{ ...btn(false), marginLeft: 'auto', color: '#666', borderColor: 'rgba(255,255,255,0.07)' }}>
            ✕ story
          </button>
        )}
      </div>

      {/* chart */}
      <div ref={wrapRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg width={w} height={h} style={{ display: 'block' }}>

          {/* quadrant fills + dividers + labels */}
          {xDiv != null && yDiv != null && (() => {
            const qW = w - m.right - xDiv, qH = yDiv - m.top;
            const qW2 = xDiv - m.left,    qH2 = h - m.bottom - yDiv;
            return (
              <>
                <rect x={xDiv}   y={m.top} width={Math.max(0, qW)}  height={Math.max(0, qH)}  fill={QUAD.civilization.fill} />
                <rect x={m.left} y={m.top} width={Math.max(0, qW2)} height={Math.max(0, qH)}  fill={QUAD.sacred.fill} />
                <rect x={xDiv}   y={yDiv}  width={Math.max(0, qW)}  height={Math.max(0, qH2)} fill={QUAD.factory.fill} />
                <rect x={m.left} y={yDiv}  width={Math.max(0, qW2)} height={Math.max(0, qH2)} fill={QUAD.dormant.fill} />

                <line x1={xDiv} y1={m.top}       x2={xDiv}       y2={h - m.bottom} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <line x1={m.left} y1={yDiv}       x2={w - m.right} y2={yDiv}        stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

                {qW2 > 30 && (
                  <>
                    <text x={(xDiv + w - m.right) / 2} y={m.top + 14} textAnchor="middle" fill={QUAD.civilization.text} fontSize={9} fontStyle="italic">Civilizations</text>
                    <text x={(m.left + xDiv) / 2}       y={m.top + 14} textAnchor="middle" fill={QUAD.sacred.text}       fontSize={9} fontStyle="italic">Sacred Cores</text>
                    <text x={(xDiv + w - m.right) / 2} y={h - m.bottom - 6} textAnchor="middle" fill={QUAD.factory.text} fontSize={9} fontStyle="italic">Word Factories</text>
                    <text x={(m.left + xDiv) / 2}       y={h - m.bottom - 6} textAnchor="middle" fill={QUAD.dormant.text} fontSize={9} fontStyle="italic">Dormant Seeds</text>
                  </>
                )}
              </>
            );
          })()}

          {/* x ticks */}
          {xScale && xScale.ticks(5).map(t => (
            <g key={t} transform={`translate(${xScale(t)},${h - m.bottom})`}>
              <line y2={5} stroke="rgba(255,255,255,0.1)" />
              <text y={17} textAnchor="middle" fill="#3a3a3a" fontSize={9}>{d3.format('~s')(t)}</text>
            </g>
          ))}
          {/* y ticks */}
          {yScale && yScale.ticks(5).map(t => (
            <g key={t} transform={`translate(${m.left},${yScale(t)})`}>
              <line x2={-5} stroke="rgba(255,255,255,0.1)" />
              <text x={-8} dy="0.35em" textAnchor="end" fill="#3a3a3a" fontSize={9}>{d3.format('~s')(t)}</text>
            </g>
          ))}

          {/* axis labels */}
          <text x={(m.left + w - m.right) / 2} y={h - 6} textAnchor="middle" fill="#444" fontSize={11}>
            {entityMeta.xLabel}
          </text>
          <text transform={`translate(13,${(m.top + h - m.bottom) / 2}) rotate(-90)`} textAnchor="middle" fill="#444" fontSize={11}>
            {entityMeta.yLabel}
          </text>

          {/* data points */}
          {xScale && yScale && pts.map(d => {
            const cx = xScale(d.x_val), cy = yScale(d.y_val);
            if (!isFinite(cx) || !isFinite(cy)) return null;
            const r     = rScale(d.sizes[sizeKey] || 0);
            const clr   = PHON_CLASSES[d.r1]?.color || '#666';
            const isOut = outlierSet.has(d.id);
            const isHov = hovered?.id === d.id;
            const isClk = clicked?.id === d.id;
            return (
              <g key={d.id}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setClicked(prev => prev?.id === d.id ? null : d)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={cx} cy={cy} r={r}
                  fill={isClk ? '#fff' : clr}
                  fillOpacity={isHov || isClk ? 1 : 0.65}
                  stroke={isOut || isClk ? clr : 'none'}
                  strokeWidth={isClk ? 3 : 1.5}
                  strokeOpacity={isClk ? 0.9 : 0.7}
                />
                {(isOut || isHov || isClk) && (
                  <text x={cx} y={cy - r - 4} textAnchor="middle" fill={clr} fontSize={10}
                    style={{ fontFamily: 'serif', direction: 'rtl', pointerEvents: 'none' }}>
                    {d.id}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* legend */}
        <div style={{ position: 'absolute', top: m.top, right: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(CLASS_META).map(([cls, meta]) => (
            <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: meta.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0, display: 'inline-block' }} />
              {meta.label}
            </span>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 4, paddingTop: 4 }}>
            <div style={{ color: '#2a2a2a', fontSize: 8 }}>size = {SIZE_OPTS.find(s => s.key === sizeKey)?.label}</div>
            <div style={{ color: '#1f1f1f', fontSize: 8 }}>outlined = notable</div>
          </div>
        </div>

        {/* hover tooltip */}
        {hovered && !clicked && (() => {
          const q  = getQ(hovered, xMedian, yMedian);
          const QD = QUAD[q];
          return (
            <div style={{
              position: 'absolute', top: 40, left: m.left + 8, pointerEvents: 'none',
              background: 'rgba(0,0,0,0.92)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 12px', fontSize: 12, lineHeight: 1.7, maxWidth: 200,
            }}>
              <div style={{ fontSize: 18, fontFamily: 'serif', color: PHON_CLASSES[hovered.r1]?.color || '#eab308', marginBottom: 1 }}>{hovered.id}</div>
              <div style={{ fontSize: 9, color: QD.text, marginBottom: 5 }}>{QD.label}</div>
              <div style={{ color: '#555' }}>fertility: <span style={{ color: '#22c55e' }}>{hovered.x_val.toLocaleString()}</span></div>
              <div style={{ color: '#555' }}>gravity: <span style={{ color: '#ef4444' }}>{hovered.y_val.toLocaleString()}</span></div>
              <div style={{ color: '#555' }}>density: <span style={{ color: '#a855f7' }}>{(hovered.sizes.density || 0).toFixed(1)}×</span></div>
              <div style={{ color: '#333', fontSize: 9, marginTop: 3 }}>click for story</div>
            </div>
          );
        })()}

        {/* story panel */}
        {story && clicked && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(4,4,10,0.96)', borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '10px 14px 14px', maxHeight: '42%', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 20, fontFamily: 'serif', color: PHON_CLASSES[clicked.r1]?.color || '#eab308' }}>
                {clicked.id}
              </span>
              {clickedQ && (
                <span style={{
                  fontSize: 9, color: QUAD[clickedQ].text, padding: '2px 8px',
                  borderRadius: 20, border: `1px solid ${QUAD[clickedQ].text}`,
                  background: QUAD[clickedQ].fill,
                }}>
                  {QUAD[clickedQ].label}
                </span>
              )}
            </div>
            <div style={{ color: '#555', fontSize: 12, lineHeight: 1.8 }}>{story}</div>
          </div>
        )}
      </div>
    </div>
  );
}
