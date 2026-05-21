import { useEffect, useState, useRef } from 'react';
import { ForceGraph3D } from 'react-force-graph';
import { fetchObservabilityMetrics, fetchUniverseGraph } from '../../services/apiService';

const NODE_COLORS = {
  root:       '#22c55e',
  word:       '#ef4444',
  form:       '#3b82f6',
  corpusitem: '#eab308',
};

// log scale matching existing GraphVisualization range [1, 27521] → [1, 12]
function wordNodeSize(dataSize) {
  const clamped = Math.max(1, Math.min(dataSize || 1, 27521));
  return 1 + (Math.log10(clamped) / Math.log10(27521)) * 11;
}

// Distribute nodes onto spherical shells by type using the Fibonacci sphere
// algorithm so nodes are uniformly spread rather than randomly clustered.
function assignSpherePositions(nodes) {
  const radii    = { root: 130, word: 320, form: 355, corpusitem: 520 };
  const totals   = {};
  const counters = {};
  nodes.forEach(n => { totals[n.type] = (totals[n.type] || 0) + 1; });
  Object.keys(totals).forEach(t => { counters[t] = 0; });

  const PHI = Math.PI * (3 - Math.sqrt(5)); // golden angle

  return nodes.map(node => {
    const r     = radii[node.type] || 320;
    const total = totals[node.type] || 1;
    const i     = counters[node.type]++;
    const y     = 1 - (i / Math.max(total - 1, 1)) * 2;
    const sinT  = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = PHI * i;
    return {
      ...node,
      fx: Math.cos(theta) * sinT * r,
      fy: y * r,
      fz: Math.sin(theta) * sinT * r,
    };
  });
}

function StatCard({ label, value, accent }) {
  const accentClass = {
    green:  'text-green-400',
    red:    'text-red-400',
    yellow: 'text-yellow-400',
    blue:   'text-blue-400',
  }[accent] || 'text-gray-300';

  const formatted = value == null
    ? '—'
    : typeof value === 'string'
      ? value
      : Number(value).toLocaleString();

  return (
    <div className="flex flex-col items-center px-5 py-3 border-r border-gray-800 last:border-r-0">
      <span className={`text-base font-mono font-bold ${accentClass}`}>{formatted}</span>
      <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function Universe() {
  const [metrics, setMetrics]       = useState(null);
  const [graphData, setGraphData]   = useState(null);
  const [graphStatus, setGraphStatus] = useState('loading');
  const containerRef = useRef();
  const [dims, setDims] = useState({ width: 800, height: 600 });

  // Track container size so ForceGraph3D fills the available space
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDims({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Load metrics and graph independently so the stats bar appears quickly
  useEffect(() => {
    fetchObservabilityMetrics()
      .then(data => setMetrics(data.snapshot?.core_snapshot))
      .catch(err => console.error('[Universe] metrics:', err));

    fetchUniverseGraph()
      .then(data => {
        const positioned = assignSpherePositions(data.nodes || []);
        setGraphData({ nodes: positioned, links: data.links || [] });
        setGraphStatus('ready');
      })
      .catch(err => {
        console.error('[Universe] graph:', err);
        setGraphStatus('error');
      });
  }, []);

  const snap = metrics;

  return (
    <div className="flex flex-col h-full" style={{ background: '#000011' }}>

      {/* Stats strip */}
      <div className="flex flex-wrap border-b border-gray-800 shrink-0">
        <StatCard label="Roots"        value={snap?.metrics?.total_roots}             accent="green"  />
        <StatCard label="Words"        value={snap?.metrics?.total_words}             accent="red"    />
        <StatCard label="Quran Items"  value={snap?.quran?.total_items}               accent="yellow" />
        <StatCard label="Linked"       value={snap?.quran?.linked_items}              accent="yellow" />
        <StatCard label="Coverage"     value={snap?.quran?.coverage_percent != null ? `${snap.quran.coverage_percent}%` : null} accent="yellow" />
        <StatCard label="Corpus Links" value={snap?.linkage?.total_corpus_word_links} accent="blue"   />
        <StatCard label="Orphan Words" value={snap?.data_quality?.orphan_words}       accent="red"    />
      </div>

      {/* 3D graph */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {graphStatus === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2">
            <span className="text-sm">Loading universe…</span>
            <span className="text-xs text-gray-600">First load computes the full graph — may take a moment</span>
          </div>
        )}
        {graphStatus === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-red-500 text-sm">
            Failed to load universe data.
          </div>
        )}
        {graphStatus === 'ready' && graphData && (
          <ForceGraph3D
            graphData={graphData}
            width={dims.width}
            height={dims.height}
            backgroundColor="#000011"
            nodeColor={node => NODE_COLORS[node.type] || '#ffffff'}
            nodeVal={node => {
              if (node.type === 'word')       return wordNodeSize(node.dataSize);
              if (node.type === 'root')       return 4;
              if (node.type === 'corpusitem') return 1.5;
              return 0.8; // form
            }}
            nodeLabel={node => node.label || ''}
            linkColor={() => 'rgba(180,180,180,0.06)'}
            linkWidth={0.15}
            cooldownTicks={0}
            d3AlphaDecay={1}
          />
        )}
      </div>

      {/* Legend */}
      {graphStatus === 'ready' && (
        <div className="flex gap-4 px-4 py-2 border-t border-gray-800 shrink-0">
          {Object.entries({ Root: '#22c55e', Word: '#ef4444', Form: '#3b82f6', Corpus: '#eab308' }).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
          <span className="ml-auto text-xs text-gray-600">word size ∝ corpus frequency</span>
        </div>
      )}
    </div>
  );
}
