import { useEffect, useState, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { fetchBiradicals, fetchRadicalPositions, fetchR3Depth, fetchCorpora, fetchTopRoots } from '../../services/apiService';
import { useSize } from '../analytics/shared';
import { PHON_CLASSES, CLASS_META, sameClass } from '../analytics/phonology';
import Overview        from '../analytics/Overview';
import FertilityGravity from '../analytics/FertilityGravity';
import SoundProfile    from '../analytics/SoundProfile';
import Scatter3D      from '../analytics/Scatter3D';
import DepthMap       from '../analytics/DepthMap';
import NetworkGraph   from '../analytics/NetworkGraph';
import OCPMatrix      from '../analytics/OCPMatrix';
import DepthFertility from '../analytics/DepthFertility';
import ZipfChart      from '../analytics/ZipfChart';
import LeadershipChart from '../analytics/LeadershipChart';
import DarkMatter      from '../analytics/DarkMatter';
import Depth3D              from '../analytics/Depth3D';
import DirectionalityChart  from '../analytics/DirectionalityChart';
import RadicalGravity        from '../analytics/RadicalGravity';


// ─── Chart 2 · Bi-Radical Heatmap (with phonological overlay) ───────────────

function Heatmap({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [hovered, setHovered] = useState(null);
  const [phonMode, setPhonMode] = useState(false);

  const { radicals, matrix, colorScale, ocpStats } = useMemo(() => {
    const r1set = new Set(), r2set = new Set();
    data.forEach(d => { const [a, b] = d.pair_key.split('-'); if (a) r1set.add(a); if (b) r2set.add(b); });
    const allR = [...new Set([...r1set, ...r2set])].sort();
    const map  = {};
    data.forEach(d => { map[d.pair_key] = d; });
    const color = d3.scaleSequential(d3.interpolate('#111827', '#eab308')).domain([0, d3.max(data, d => d.root_count) || 1]);

    // OCP stats: same-class pairs vs cross-class pairs, populated %
    let sameTotal = 0, samePop = 0, crossTotal = 0, crossPop = 0;
    allR.forEach(r1 => allR.forEach(r2 => {
      if (r1 === r2) return;
      const sc = sameClass(r1, r2);
      const pop = !!map[`${r1}-${r2}`];
      if (sc) { sameTotal++; if (pop) samePop++; }
      else    { crossTotal++; if (pop) crossPop++; }
    }));

    return { radicals: allR, matrix: map, colorScale: color, ocpStats: { sameTotal, samePop, crossTotal, crossPop } };
  }, [data]);

  const n = radicals.length;
  const labelPad = 28;
  const cellSize = Math.min(Math.floor((Math.min(w, h) - labelPad * 2) / n), 22);
  const offsetX  = (w - cellSize * n - labelPad) / 2 + labelPad;
  const offsetY  = (h - cellSize * n - labelPad) / 2 + labelPad;

  const samePct  = ocpStats.sameTotal  ? ((ocpStats.samePop  / ocpStats.sameTotal)  * 100).toFixed(1) : '—';
  const crossPct = ocpStats.crossTotal ? ((ocpStats.crossPop / ocpStats.crossTotal) * 100).toFixed(1) : '—';

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {radicals.map((rad, ci) => (
          <text key={`c-${rad}`} x={offsetX + ci * cellSize + cellSize / 2} y={offsetY - 6}
            textAnchor="middle" fill={phonMode ? (PHON_CLASSES[rad]?.color || '#666') : '#555'}
            fontSize={Math.min(cellSize - 2, 11)} style={{ fontFamily: 'serif', direction: 'rtl' }}>
            {rad}
          </text>
        ))}
        {radicals.map((rad, ri) => (
          <text key={`r-${rad}`} x={offsetX - 6} y={offsetY + ri * cellSize + cellSize / 2}
            textAnchor="end" dominantBaseline="middle"
            fill={phonMode ? (PHON_CLASSES[rad]?.color || '#666') : '#555'}
            fontSize={Math.min(cellSize - 2, 11)} style={{ fontFamily: 'serif', direction: 'rtl' }}>
            {rad}
          </text>
        ))}
        {radicals.map((r1, ri) =>
          radicals.map((r2, ci) => {
            const key  = `${r1}-${r2}`;
            const d    = matrix[key];
            const isHov = hovered?.pair_key === key;
            const isSC  = phonMode && sameClass(r1, r2);
            return (
              <rect key={key}
                x={offsetX + ci * cellSize} y={offsetY + ri * cellSize}
                width={cellSize - 1} height={cellSize - 1}
                fill={d ? colorScale(d.root_count) : '#111827'}
                stroke={isHov ? '#fff' : isSC && !d ? 'rgba(239,68,68,0.4)' : 'none'}
                strokeWidth={isHov ? 1.5 : 0.8}
                onMouseEnter={() => setHovered(d ? { ...d } : { pair_key: key, empty: true })}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })
        )}
      </svg>

      {/* phonology toggle */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setPhonMode(m => !m)} style={{
          padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
          background: phonMode ? 'rgba(239,68,68,0.15)' : 'transparent',
          border: `1px solid ${phonMode ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
          color: phonMode ? '#ef4444' : '#555',
        }}>
          OCP overlay
        </button>
        {phonMode && (
          <span style={{ fontSize: 11, color: '#555' }}>
            same-class: <span style={{ color: '#eab308' }}>{samePct}%</span> populated
            &nbsp;· cross-class: <span style={{ color: '#22c55e' }}>{crossPct}%</span> populated
          </span>
        )}
      </div>

      {/* phon legend */}
      {phonMode && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(CLASS_META).map(([cls, meta]) => (
            <span key={cls} style={{ fontSize: 10, color: meta.color, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.color, display: 'inline-block', flexShrink: 0 }} />
              {meta.label}
            </span>
          ))}
        </div>
      )}

      {hovered && (
        <div style={{ position: 'absolute', bottom: 40, right: 16, background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none' }}>
          <div style={{ fontSize: 20, fontFamily: 'serif', direction: 'rtl', color: '#eab308', marginBottom: 4 }}>{hovered.pair_key}</div>
          {hovered.empty ? (
            <div style={{ color: '#444', fontStyle: 'italic' }}>unmapped — measurable absence</div>
          ) : (
            <>
              <div style={{ color: '#aaa' }}>roots: <span style={{ color: '#fff' }}>{hovered.root_count}</span></div>
              <div style={{ color: '#aaa' }}>words: <span style={{ color: '#22c55e' }}>{hovered.total_words?.toLocaleString()}</span></div>
              <div style={{ color: '#aaa' }}>corpus: <span style={{ color: '#ef4444' }}>{hovered.total_corpus?.toLocaleString()}</span></div>
            </>
          )}
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#333', fontSize: 11 }}>0 roots</span>
        <svg width={120} height={10}>
          <defs>
            <linearGradient id="hm-grad2">
              <stop offset="0%"   stopColor="#111827" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          <rect width={120} height={10} rx={3} fill="url(#hm-grad2)" />
        </svg>
        <span style={{ color: '#555', fontSize: 11 }}>many roots</span>
      </div>
    </div>
  );
}

// ─── Chart 3 · Radical Position Ecology ─────────────────────────────────────

const POS_COLORS = { r1: '#22c55e', r2: '#3b82f6', r3: '#a855f7' };
const METRICS = [{ key: 'roots', label: 'roots' }, { key: 'words', label: 'words' }, { key: 'corpus', label: 'corpus gravity' }];

function EcologyChart({ data }) {
  const wrapRef = useRef();
  const { w, h } = useSize(wrapRef);
  const [metric, setMetric] = useState('roots');
  const [posFilter, setPosFilter] = useState('all');
  const [hovered, setHovered] = useState(null);

  const { radicals, grouped, maxVal } = useMemo(() => {
    const g = {};
    data.forEach(d => {
      if (!g[d.radical]) g[d.radical] = { r1: 0, r2: 0, r3: 0 };
      g[d.radical][d.position] = d[metric];
    });
    let rads = Object.keys(g);
    if (posFilter === 'all') {
      rads = rads.sort();
    } else {
      rads = rads.sort((a, b) => (g[b]?.[posFilter] || 0) - (g[a]?.[posFilter] || 0));
    }
    const mv = posFilter === 'all'
      ? d3.max(rads, r => Math.max(g[r].r1, g[r].r2, g[r].r3)) || 1
      : d3.max(rads, r => g[r][posFilter] || 0) || 1;
    return { radicals: rads, grouped: g, maxVal: mv };
  }, [data, metric, posFilter]);

  const m = { top: 8, right: 60, bottom: 8, left: 36 };
  const rowH    = Math.max(14, Math.min(24, Math.floor((h - m.top - m.bottom) / (radicals.length || 1))));
  const barH    = posFilter === 'all' ? Math.floor(rowH * 0.28) : Math.floor(rowH * 0.7);
  const barGap  = 2;
  const maxBarW = w - m.left - m.right;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {METRICS.map(mx => (
          <button key={mx.key} onClick={() => setMetric(mx.key)} style={{
            padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: metric === mx.key ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.15)', color: metric === mx.key ? '#fff' : '#555',
          }}>{mx.label}</button>
        ))}
        <span style={{ color: '#222', marginLeft: 4 }}>|</span>
        {['all', 'r1', 'r2', 'r3'].map(p => (
          <button key={p} onClick={() => setPosFilter(p)} style={{
            padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: posFilter === p ? (p === 'all' ? 'rgba(255,255,255,0.12)' : POS_COLORS[p] + '33') : 'transparent',
            border: `1px solid ${posFilter === p ? (p === 'all' ? 'rgba(255,255,255,0.3)' : POS_COLORS[p]) : 'rgba(255,255,255,0.12)'}`,
            color: posFilter === p ? (p === 'all' ? '#fff' : POS_COLORS[p]) : '#555',
          }}>{p === 'all' ? 'all positions' : p}</button>
        ))}
      </div>
      <div ref={wrapRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <svg width={w} height={Math.max(h, radicals.length * rowH + m.top + m.bottom)} style={{ display: 'block' }}>
          {radicals.map((rad, ri) => {
            const g = grouped[rad], y0 = m.top + ri * rowH, isHov = hovered === rad;
            const clsColor = PHON_CLASSES[rad]?.color || '#666';
            return (
              <g key={rad} onMouseEnter={() => setHovered(rad)} onMouseLeave={() => setHovered(null)}>
                {isHov && <rect x={0} y={y0} width={w} height={rowH} fill="rgba(255,255,255,0.03)" />}
                <text x={m.left - 4} y={y0 + rowH / 2} textAnchor="end" dominantBaseline="middle"
                  fill={isHov ? '#fff' : clsColor} fontSize={Math.min(rowH - 2, 13)} style={{ fontFamily: 'serif' }}>
                  {rad}
                </text>
                {posFilter === 'all' ? (
                  ['r1','r2','r3'].map((pos, pi) => {
                    const val = g?.[pos] || 0;
                    const bw  = (val / maxVal) * maxBarW;
                    const by  = y0 + (rowH - (barH * 3 + barGap * 2)) / 2 + pi * (barH + barGap);
                    return <rect key={pos} x={m.left} y={by} width={Math.max(1, bw)} height={barH} fill={POS_COLORS[pos]} opacity={0.8} rx={1} />;
                  })
                ) : (() => {
                  const val = g?.[posFilter] || 0;
                  const bw  = (val / maxVal) * maxBarW;
                  const by  = y0 + (rowH - barH) / 2;
                  return <>
                    <rect x={m.left} y={by} width={Math.max(1, bw)} height={barH} fill={clsColor} opacity={isHov ? 1 : 0.75} rx={1} />
                    {bw > 30 && <text x={m.left + bw - 3} y={y0 + rowH / 2} textAnchor="end" dominantBaseline="middle" fill="rgba(0,0,0,0.5)" fontSize={8}>{val.toLocaleString()}</text>}
                  </>;
                })()}
              </g>
            );
          })}
        </svg>
        {hovered && grouped[hovered] && (
          <div style={{ position: 'absolute', top: 8, right: 24, background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7, pointerEvents: 'none' }}>
            <div style={{ fontSize: 20, fontFamily: 'serif', color: '#eab308', marginBottom: 4 }}>{hovered}</div>
            {['r1','r2','r3'].map(p => (
              <div key={p} style={{ color: '#aaa' }}>{p}: <span style={{ color: POS_COLORS[p] }}>{(grouped[hovered][p] || 0).toLocaleString()}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Interpretive Reports ────────────────────────────────────────────────────

const REPORTS = {
  1:  '654 bi-radical families map the morphological genome of Arabic. Sacred cores (high gravity, low fertility) carry enormous textual weight from few words — the Quranic register. Civilizations (high in both) are the generative backbone: knowledge, movement, governance. The gap between gravity and fertility is not a diagonal but a split — most families specialize, not generalize.',
  2:  'Each cell is a possible r1-r2 consonant pairing. Dark cells are absent — either OCP-forbidden (same phonological class, red-bordered axis) or phonotactically restricted. Some r1 consonants generate far more families than others, revealing that Arabic\'s morphological real estate is unevenly distributed across its consonant inventory.',
  3:  'Arabic radicals are not positionally interchangeable. Some strongly prefer r1 (semantic initiators), others cluster in r2 (modifiers), a few specialize in r3 (completors). This positional specialization correlates with articulatory properties — gutturals and coronals behave differently, encoding phonological constraints into the morphological hierarchy itself.',
  4:  'Adding form diversity (z-axis) separates two families that look identical in 2D: those producing many words but few morphological patterns vs those generating the full paradigmatic range. Color encodes gravity density — how corpus-heavy each word is on average. Red clusters are semantically dense: few words, each appearing many times. Green clusters are productive but light.',
  5:  'r3 depth measures how far Arabic committed to each bi-radical core. A family with 20+ r3 completions has been extensively elaborated — the r1-r2 pair acts as a phonological attractor. The deepest families are Arabic\'s most generative morphological engines. Black cells are structurally absent; the dim zone is families that exist but weren\'t deeply explored.',
  6:  'Radicals that pull to the center of the force graph are morphological hubs — dense participation in both r1 and r2 roles. Edge thickness encodes root count per pairing. Same-colored edges (same phonological class) should appear thinner and more peripheral — the OCP signal expressed as network topology rather than occupancy percentages.',
  7:  'The Obligatory Contour Principle (McCarthy 1986) predicts same-class consonant pairs will be underrepresented in r1-r2 position. Diagonal cells (red border) show same-class occupancy; off-diagonal shows cross-class. If cross-class average substantially exceeds same-class, OCP operates at the articulatory class level — not just at identity (a radical paired with itself, which never appears).',
  8:  'Structural depth (r3 diversity) and lexical fertility (word count) are genuinely independent morphological dimensions. Most families specialize: they go wide (many words from few patterns) or deep (few words from many consonantal variations), rarely both. Generative engines in the top-right are Arabic\'s most committed roots. Sprouts in the bottom-left are narrow, young, or phonotactically constrained.',
  9:  'Corpus gravity across bi-radical families follows a steep power law. Top families (red dots) command orders-of-magnitude more textual presence than the long tail. A slope steeper than −1 means concentration exceeds classic Zipf — consistent with the heavy gravitational pull of Quranic vocabulary on the corpus: a small set of roots dominates everything.',
  10: 'Leadership = r1 share of a radical\'s total root appearances. Above 45% → morphological initiator; below 25% → follower. Phonological class coloring tests whether leadership is articulatory: if gutturals systematically score low and coronals high, the phonology of the consonant itself may be driving its positional preference across the entire root system.',
  11: 'The invisible lexical space: pairs of Arabic consonants that could form bi-radical families but don\'t. Gold (mystery) pairs are cross-class and phonologically permitted — the language could have gone there but didn\'t. Red (OCP) pairs are same-class, theoretically suppressed by articulatory constraint. The mystery pairs are the most interesting: some may exist in historical or dialectal Arabic, others may reveal deeper phonotactic laws not captured by the five-class model.',
  14: 'Which Arabic radicals are the heaviest root anchors? x-axis: how strongly each radical prefers r1 over r2 (rightward = initiator, leftward = follower). y-axis: total corpus flowing through families where this radical appears in r1 — its absolute gravitational weight as a root anchor (log scale). Dot size = distinct roots initiated. Dot border: green = directionality analysis confirms r1 dominance across reversible pairs, red = the radical actually loses when its r1 direction competes with the reverse. The top-right quadrant contains the primary anchors — consonants that are both heavy and consistent r1 initiators. Language acquisition research shows high-frequency, morphologically rich vocabulary is acquired earlier. If the primary anchors cluster in specific phonological classes, those consonants may be acquired first not just for articulatory reasons but because they appear in the most-repeated, semantically central words. Switching the corpus filter to Quran shows which radicals anchor Quranic vocabulary specifically.',
  13: 'For any consonant pair {X,Y} where both X-Y and Y-X exist as attested families, which ordering is more productive? The asymmetry score (fwd−rev)/(fwd+rev) measures directional dominance from −1 (reverse completely dominates) to +1 (forward completely dominates). Pair view shows the most asymmetric pairs across corpus, words, depth, and root metrics — bold label is the dominant direction. Class view reveals whether phonological classes systematically prefer r1 or r2: a guttural class consistently below the centerline means gutturals are morphological followers; one above means they anchor roots. The 5×5 matrix shows which class tends to dominate when any two classes meet in a root.',
  12: 'The r3 depth landscape in three dimensions. Each point in the floor grid is a bi-radical family (r1 × r2 consonant pair). Height encodes how many distinct r3 consonants complete that pair — how far Arabic committed to elaborating that root core. Tall columns are morphological attractors: the r1-r2 pair pulled the language into deep phonological elaboration. Color reveals whether that depth is concentrated in one phonological class or spread across all five. Drag to rotate, scroll to zoom.',
};

// ─── Main Analytics Page ─────────────────────────────────────────────────────

const CHARTS = [
  { id: 0,  label: 'Overview'            },
  { id: 1,  label: 'Fertility × Gravity' },
  { id: 2,  label: 'Bi-Radical Heatmap'  },
  { id: 3,  label: 'Position Ecology'    },
  { id: 4,  label: '3D Space'            },
  { id: 5,  label: 'r3 Depth'            },
  { id: 6,  label: 'Radical Network'     },
  { id: 7,  label: 'OCP Matrix'          },
  { id: 8,  label: 'Depth × Fertility'   },
  { id: 9,  label: 'Zipf'               },
  { id: 10, label: 'Leadership'          },
  { id: 11, label: 'Dark Matter'         },
  { id: 12, label: 'Depth 3D'           },
  { id: 13, label: 'Directionality'    },
  { id: 14, label: 'Radical Gravity'  },
  { id: 15, label: 'Sound Profile'    },
];

// 114 Quran surah names [number, arabic, english]
const SURAHS = [
  [1,'الفاتحة','Al-Fatiha'],[2,'البقرة','Al-Baqara'],[3,'آل عمران','Ali Imran'],[4,'النساء','An-Nisa'],
  [5,'المائدة','Al-Maida'],[6,'الأنعام','Al-Anam'],[7,'الأعراف','Al-Araf'],[8,'الأنفال','Al-Anfal'],
  [9,'التوبة','At-Tawba'],[10,'يونس','Yunus'],[11,'هود','Hud'],[12,'يوسف','Yusuf'],
  [13,'الرعد','Ar-Rad'],[14,'إبراهيم','Ibrahim'],[15,'الحجر','Al-Hijr'],[16,'النحل','An-Nahl'],
  [17,'الإسراء','Al-Isra'],[18,'الكهف','Al-Kahf'],[19,'مريم','Maryam'],[20,'طه','Ta-Ha'],
  [21,'الأنبياء','Al-Anbiya'],[22,'الحج','Al-Hajj'],[23,'المؤمنون','Al-Muminun'],[24,'النور','An-Nur'],
  [25,'الفرقان','Al-Furqan'],[26,'الشعراء','Ash-Shuara'],[27,'النمل','An-Naml'],[28,'القصص','Al-Qasas'],
  [29,'العنكبوت','Al-Ankabut'],[30,'الروم','Ar-Rum'],[31,'لقمان','Luqman'],[32,'السجدة','As-Sajda'],
  [33,'الأحزاب','Al-Ahzab'],[34,'سبأ','Saba'],[35,'فاطر','Fatir'],[36,'يس','Ya-Sin'],
  [37,'الصافات','As-Saffat'],[38,'ص','Sad'],[39,'الزمر','Az-Zumar'],[40,'غافر','Ghafir'],
  [41,'فصلت','Fussilat'],[42,'الشورى','Ash-Shura'],[43,'الزخرف','Az-Zukhruf'],[44,'الدخان','Ad-Dukhan'],
  [45,'الجاثية','Al-Jathiya'],[46,'الأحقاف','Al-Ahqaf'],[47,'محمد','Muhammad'],[48,'الفتح','Al-Fath'],
  [49,'الحجرات','Al-Hujurat'],[50,'ق','Qaf'],[51,'الذاريات','Adh-Dhariyat'],[52,'الطور','At-Tur'],
  [53,'النجم','An-Najm'],[54,'القمر','Al-Qamar'],[55,'الرحمن','Ar-Rahman'],[56,'الواقعة','Al-Waqia'],
  [57,'الحديد','Al-Hadid'],[58,'المجادلة','Al-Mujadila'],[59,'الحشر','Al-Hashr'],[60,'الممتحنة','Al-Mumtahina'],
  [61,'الصف','As-Saf'],[62,'الجمعة','Al-Jumuah'],[63,'المنافقون','Al-Munafiqun'],[64,'التغابن','At-Taghabun'],
  [65,'الطلاق','At-Talaq'],[66,'التحريم','At-Tahrim'],[67,'الملك','Al-Mulk'],[68,'القلم','Al-Qalam'],
  [69,'الحاقة','Al-Haqqa'],[70,'المعارج','Al-Maarij'],[71,'نوح','Nuh'],[72,'الجن','Al-Jinn'],
  [73,'المزمل','Al-Muzzammil'],[74,'المدثر','Al-Muddaththir'],[75,'القيامة','Al-Qiyama'],[76,'الإنسان','Al-Insan'],
  [77,'المرسلات','Al-Mursalat'],[78,'النبأ','An-Naba'],[79,'النازعات','An-Naziat'],[80,'عبس','Abasa'],
  [81,'التكوير','At-Takwir'],[82,'الانفطار','Al-Infitar'],[83,'المطففين','Al-Mutaffifin'],[84,'الانشقاق','Al-Inshiqaq'],
  [85,'البروج','Al-Buruj'],[86,'الطارق','At-Tariq'],[87,'الأعلى','Al-Ala'],[88,'الغاشية','Al-Ghashiya'],
  [89,'الفجر','Al-Fajr'],[90,'البلد','Al-Balad'],[91,'الشمس','Ash-Shams'],[92,'الليل','Al-Layl'],
  [93,'الضحى','Ad-Duha'],[94,'الشرح','Ash-Sharh'],[95,'التين','At-Tin'],[96,'العلق','Al-Alaq'],
  [97,'القدر','Al-Qadr'],[98,'البينة','Al-Bayyina'],[99,'الزلزلة','Az-Zalzala'],[100,'العاديات','Al-Adiyat'],
  [101,'القارعة','Al-Qariah'],[102,'التكاثر','At-Takathur'],[103,'العصر','Al-Asr'],[104,'الهمزة','Al-Humaza'],
  [105,'الفيل','Al-Fil'],[106,'قريش','Quraysh'],[107,'الماعون','Al-Maun'],[108,'الكوثر','Al-Kawthar'],
  [109,'الكافرون','Al-Kafirun'],[110,'النصر','An-Nasr'],[111,'المسد','Al-Masad'],[112,'الإخلاص','Al-Ikhlas'],
  [113,'الفلق','Al-Falaq'],[114,'الناس','An-Nas'],
];

export default function Analytics() {
  const [biradicals, setBiradicals] = useState([]);
  const [positions,  setPositions]  = useState([]);
  const [depths,     setDepths]     = useState([]);
  const [topRoots,   setTopRoots]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [chart,      setChart]      = useState(0);
  const [corpora,    setCorpora]    = useState([]);
  const [corpusId,   setCorpusId]   = useState('all');
  const [surah,      setSurah]      = useState(null); // only active when corpusId === '2'
  const [surahSearch, setSurahSearch] = useState('');

  const isQuran = corpusId === '2';

  // Load corpora list once
  useEffect(() => {
    fetchCorpora().then(d => setCorpora(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Clear surah when leaving Quran corpus
  useEffect(() => {
    if (!isQuran) setSurah(null);
  }, [isQuran]);

  // Re-fetch all analytics data when corpus or surah changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchBiradicals(corpusId, surah),
      fetchRadicalPositions(corpusId, surah),
      fetchR3Depth(corpusId, surah),
      fetchTopRoots(corpusId, surah),
    ])
      .then(([b, p, r, t]) => {
        setBiradicals(b.biradicals || []);
        setPositions(p.positions   || []);
        setDepths(r.depths         || []);
        setTopRoots(t.roots        || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [corpusId, surah]);

  const tab = active => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    color: active ? '#fff' : '#444',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  });

  const counts = biradicals.length;
  const trueRoots = depths.reduce((s, d) => s + d.r3_count, 0);
  const totalWords = biradicals.reduce((s, d) => s + d.total_words, 0);
  const totalCorpus = biradicals.reduce((s, d) => s + d.total_corpus, 0);
  const seenRadicals = new Set(biradicals.flatMap(d => d.pair_key.split('-').filter(Boolean))).size;
  const totalPossible = seenRadicals > 0 ? seenRadicals * (seenRadicals - 1) : 0;
  const coverage = totalPossible > 0 ? ((counts / totalPossible) * 100).toFixed(0) : '—';
  const avgRoots = counts > 0 ? (trueRoots / counts).toFixed(1) : '—';
  const r3Coverage = counts > 0 ? `${((depths.length / counts) * 100).toFixed(0)}% of families` : '';

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f', display: 'flex', flexDirection: 'column', color: '#fff', paddingBottom: 60 }}>
      {/* header — chart tabs + corpus selector */}
      <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', minWidth: 0 }}>
          <span style={{ color: '#333', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Morphology</span>
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', minWidth: 0 }}>
            {CHARTS.map(c => (
              <button key={c.id} style={{ ...tab(chart === c.id), flexShrink: 0 }} onClick={() => setChart(c.id)}>{c.label}</button>
            ))}
          </div>
        </div>
        {/* Corpus + Surah filter row */}
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px 4px', flexWrap: 'wrap' }}>
            <span style={{ color: '#333', fontSize: 10, flexShrink: 0 }}>corpus:</span>
            {[{ id: 'all', english: 'All corpora' }, ...corpora].map(c => {
              const active = corpusId === String(c.id);
              return (
                <button key={c.id} onClick={() => { setCorpusId(String(c.id)); setSurah(null); }} style={{
                  padding: '2px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
                  background: active ? 'rgba(168,85,247,0.18)' : 'transparent',
                  border: `1px solid ${active ? '#a855f7' : 'rgba(255,255,255,0.07)'}`,
                  color: active ? '#a855f7' : '#444',
                  flexShrink: 0,
                }}>{c.english || c.arabic || `Corpus ${c.id}`}</button>
              );
            })}
            {loading && <span style={{ color: '#333', fontSize: 10, marginLeft: 4 }}>loading…</span>}
          </div>
          {/* Surah selector — only when Quran selected */}
          {isQuran && (
            <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ color: '#333', fontSize: 10, flexShrink: 0 }}>surah:</span>
              <button onClick={() => setSurah(null)} style={{
                padding: '2px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
                background: !surah ? 'rgba(168,85,247,0.18)' : 'transparent',
                border: `1px solid ${!surah ? '#a855f7' : 'rgba(255,255,255,0.07)'}`,
                color: !surah ? '#a855f7' : '#444', flexShrink: 0,
              }}>All</button>
              <input
                value={surahSearch}
                onChange={e => setSurahSearch(e.target.value)}
                placeholder="search surah…"
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 5, padding: '2px 8px', fontSize: 10, color: '#ccc', width: 110, outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', maxWidth: 'calc(100vw - 260px)' }}>
                {SURAHS
                  .filter(([n, ar, en]) => !surahSearch || en.toLowerCase().includes(surahSearch.toLowerCase()) || String(n).includes(surahSearch) || ar.includes(surahSearch))
                  .map(([n, ar, en]) => {
                    const active = surah === String(n);
                    return (
                      <button key={n} onClick={() => setSurah(String(n))} title={`${n}. ${en} · ${ar}`} style={{
                        padding: '2px 7px', borderRadius: 5, fontSize: 10, cursor: 'pointer', flexShrink: 0,
                        background: active ? 'rgba(234,179,8,0.18)' : 'transparent',
                        border: `1px solid ${active ? '#eab308' : 'rgba(255,255,255,0.06)'}`,
                        color: active ? '#eab308' : '#555',
                      }}>{n}</button>
                    );
                  })}
              </div>
              {surah && (
                <span style={{ color: '#eab308', fontSize: 10, flexShrink: 0 }}>
                  {SURAHS[parseInt(surah) - 1]?.[2]} · {SURAHS[parseInt(surah) - 1]?.[1]}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* stats bar — single scrollable row */}
      {counts > 0 && (
        <div style={{ display: 'flex', gap: 18, padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Stat value={counts.toLocaleString()}        color="#eab308" label="r1-r2 families"     sub="bi-radical root clusters" />
          <Stat value={`${coverage}%`}               color="#22c55e" label="of possible r1-r2s" sub={`${seenRadicals} consonants, ${totalPossible} ordered pairs`} />
          <Stat value={trueRoots.toLocaleString()}    color="#a855f7" label="tri-literal roots"  sub={`distinct r1-r2-r3 combos · ${avgRoots} per family`} />
          <Stat value={totalWords.toLocaleString()}   color="#22c55e" label="lexical words"      sub="word forms derived from roots" />
          <Stat value={depths[0]?.r3_count ?? '—'}   color="#f97316" label="max r3 variants"    sub="3rd-radical options on one pair" />
        </div>
      )}

      {/* chart area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {loading && <Centered><span style={{ color: '#333' }}>loading…</span></Centered>}
        {error   && <Centered><span style={{ color: '#ef4444' }}>{error}</span></Centered>}
        {!loading && !error && chart === 0 && <Overview biradicals={biradicals} positions={positions} depths={depths} topRoots={topRoots} corpusLabel={corpusId === 'all' ? null : (corpora.find(c => String(c.id) === corpusId)?.english || `Corpus ${corpusId}`)} />}
        {!loading && !error && chart === 1 && <FertilityGravity biradicals={biradicals} depths={depths} positions={positions} />}
        {!loading && !error && chart === 2 && <Heatmap       data={biradicals} />}
        {!loading && !error && chart === 3 && <EcologyChart  data={positions} />}
        {!loading && !error && chart === 4  && <Scatter3D      data={biradicals} />}
        {!loading && !error && chart === 5  && <DepthMap       biradicals={biradicals} depths={depths} />}
        {!loading && !error && chart === 6  && <NetworkGraph   data={biradicals} />}
        {!loading && !error && chart === 7  && <OCPMatrix      data={biradicals} />}
        {!loading && !error && chart === 8  && <DepthFertility biradicals={biradicals} depths={depths} />}
        {!loading && !error && chart === 9  && <ZipfChart      data={biradicals} />}
        {!loading && !error && chart === 10 && <LeadershipChart data={positions} />}
        {!loading && !error && chart === 11 && <DarkMatter      data={biradicals} />}
        {!loading && !error && chart === 12 && <Depth3D              data={depths} />}
        {!loading && !error && chart === 13 && <DirectionalityChart  biradicals={biradicals} depths={depths} />}
        {!loading && !error && chart === 14 && <RadicalGravity       positions={positions} biradicals={biradicals} />}
        {!loading && !error && chart === 15 && <SoundProfile biradicals={biradicals} positions={positions} corpusLabel={corpusId === 'all' ? null : (corpora.find(c => String(c.id) === corpusId)?.english || `Corpus ${corpusId}`)} />}
      </div>

      {/* interpretive report strip */}
      {!loading && !error && REPORTS[chart] && (
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          fontSize: 11, color: '#444', lineHeight: 1.65,
          flexShrink: 0,
        }}>
          {REPORTS[chart]}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <span style={{ color, fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{value}</span>
      <span style={{ color: '#555', fontSize: 10, lineHeight: 1.4 }}>{label}</span>
      {sub && <span style={{ color: '#2d2d2d', fontSize: 9, lineHeight: 1.3 }}>{sub}</span>}
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

