import * as d3 from 'd3';
import { CENTER } from './projectionLayout';

const glyphColor = d3.interpolate('#241a33', '#eab308');

const NODE_STYLE = {
  position:     { fontSize: 15, textOffset: 16 },
  continuation: { fontSize: 11, textOffset: 10 },
  root:         { fontSize: 10, textOffset: 8 },
  other:        { fontSize: 9,  textOffset: 6 },
};

// Static SVG renderer for a Radical Tree layout (see
// projectionLayout.js::layoutRadicalTree). Pure — same layout object
// always produces the same markup. A compressed linguistic tree, not a
// decorative glyph: radical -> position -> bi-radical continuation -> root.
export default function RadicalTreeSVG({ layout }) {
  if (!layout) return null;
  const [x0, y0, w, h] = layout.viewBox;
  const { center, links, nodes } = layout;

  return (
    <svg viewBox={`${x0} ${y0} ${w} ${h}`} width="100%" height="100%" style={{ maxHeight: '100%' }}>
      <rect x={x0} y={y0} width={w} height={h} fill="#0a0a0f" />

      {/* d3.linkRadial paths are generated around the origin — translate into the viewBox center */}
      <g transform={`translate(${CENTER.x},${CENTER.y})`}>
        {links.map((l, i) => (
          <path key={i} d={l.d} fill="none" stroke={glyphColor(l.brightness)} strokeWidth={l.thickness} opacity={0.7} />
        ))}
      </g>

      {nodes.map(n => {
        const style = NODE_STYLE[n.kind] || NODE_STYLE.continuation;
        const isOther = n.kind === 'other';
        const dx = n.x - CENTER.x, dy = n.y - CENTER.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const tx = n.x + (dx / dist) * style.textOffset;
        const ty = n.y + (dy / dist) * style.textOffset;
        return (
          <g key={n.id}>
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill={isOther ? 'none' : glyphColor(n.brightness)}
              stroke={isOther ? 'rgba(255,255,255,0.25)' : 'none'}
              strokeDasharray={isOther ? '2 2' : 'none'}
              opacity={isOther ? 0.6 : 0.92}
            >
              {!isOther && (
                <title>{`${n.label}: ${n.roots.toLocaleString()} roots · ${n.words.toLocaleString()} words · ${n.corpus.toLocaleString()} corpus`}</title>
              )}
            </circle>
            <text
              x={tx} y={ty}
              textAnchor={dx >= 0 ? 'start' : 'end'}
              dominantBaseline="middle"
              fontSize={style.fontSize}
              fill={isOther ? '#444' : n.kind === 'root' ? '#999' : '#888'}
              style={{ fontFamily: n.kind === 'continuation' ? 'inherit' : 'serif', direction: 'rtl' }}
            >
              {n.label}
            </text>
          </g>
        );
      })}

      <circle cx={center.x} cy={center.y} r={26} fill="#0a0a0f" stroke="#eab308" strokeWidth={1.5} />
      <text x={center.x} y={center.y + 10} textAnchor="middle" fontSize={30} fill="#eab308" style={{ fontFamily: 'serif', direction: 'rtl' }}>
        {center.label}
      </text>
    </svg>
  );
}
