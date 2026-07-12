import * as d3 from 'd3';

const glyphColor = d3.interpolate('#241a33', '#eab308');
const BASE_RADIUS = 180;

// Static SVG renderer for a Bi-radical Completion Mandala layout
// (see projectionLayout.js::layoutBiradicalMandala). Pure — same
// layout object always produces the same markup.
export default function BiradicalMandalaSVG({ layout }) {
  if (!layout) return null;
  const [x0, y0, w, h] = layout.viewBox;
  const { core, nodes } = layout;

  return (
    <svg viewBox={`${x0} ${y0} ${w} ${h}`} width="100%" height="100%" style={{ maxHeight: '100%' }}>
      <rect x={x0} y={y0} width={w} height={h} fill="#0a0a0f" />

      {/* baseline ring — the "no depth" reference circle occupied nodes push out from */}
      <circle cx={w / 2} cy={h / 2} r={BASE_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />

      {nodes.map(n => (
        <g key={n.letter}>
          <line
            x1={w / 2} y1={h / 2} x2={n.x} y2={n.y}
            stroke={glyphColor(n.brightness)}
            strokeWidth={0.75}
            opacity={n.occupied ? 0.35 : 0.08}
          />
          <circle cx={n.x} cy={n.y} r={n.size} fill={glyphColor(n.brightness)} opacity={n.occupied ? 0.9 : 0.3}>
            <title>
              {n.occupied
                ? `${n.letter}: ${n.roots.toLocaleString()} roots · ${n.words.toLocaleString()} words · ${n.corpus.toLocaleString()} corpus`
                : `${n.letter}: unattested`}
            </title>
          </circle>
          {n.occupied && (
            <text
              x={n.x + (n.x > w / 2 ? n.size + 4 : -(n.size + 4))}
              y={n.y}
              textAnchor={n.x > w / 2 ? 'start' : 'end'}
              dominantBaseline="middle"
              fontSize={12}
              fill="#666"
              style={{ fontFamily: 'serif' }}
            >
              {n.letter}
            </text>
          )}
        </g>
      ))}

      <circle
        cx={core.x} cy={core.y} r={core.size}
        fill={core.occupied ? glyphColor(core.brightness) : 'none'}
        stroke="#eab308"
        strokeWidth={core.occupied ? 0 : 1.5}
        strokeDasharray={core.occupied ? 'none' : '3 3'}
      >
        <title>
          {core.occupied
            ? `${core.label} (direct): ${core.roots.toLocaleString()} roots · ${core.words.toLocaleString()} words · ${core.corpus.toLocaleString()} corpus`
            : `${core.label}: no direct biliteral form`}
        </title>
      </circle>
      <text x={core.x} y={core.y + core.size + 22} textAnchor="middle" fontSize={26} fill="#eab308" style={{ fontFamily: 'serif', direction: 'rtl' }}>
        {core.label}
      </text>
    </svg>
  );
}
