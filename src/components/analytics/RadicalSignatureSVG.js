import * as d3 from 'd3';

const glyphColor = d3.interpolate('#241a33', '#eab308');

// Static SVG renderer for a Radical Position Signature layout
// (see projectionLayout.js::layoutRadicalSignature). Pure — same
// layout object always produces the same markup.
export default function RadicalSignatureSVG({ layout }) {
  if (!layout) return null;
  const [x0, y0, w, h] = layout.viewBox;
  const { center, spokes } = layout;

  return (
    <svg viewBox={`${x0} ${y0} ${w} ${h}`} width="100%" height="100%" style={{ maxHeight: '100%' }}>
      <rect x={x0} y={y0} width={w} height={h} fill="#0a0a0f" />

      {spokes.map(s => (
        <g key={s.position}>
          <line
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={glyphColor(s.brightness)}
            strokeWidth={s.thickness}
            strokeLinecap="round"
            opacity={s.roots > 0 ? 1 : 0.4}
          />
          <circle cx={s.x2} cy={s.y2} r={Math.max(4, s.thickness * 0.9)} fill={glyphColor(s.brightness)} opacity={s.roots > 0 ? 1 : 0.4} />
          <text x={s.x2} y={s.y2 - Math.max(4, s.thickness) - 8} textAnchor="middle" fontSize={13} fill="#666" style={{ fontFamily: 'serif' }}>
            {s.position}
          </text>
          <title>{`${s.position}: ${s.roots.toLocaleString()} roots · ${s.words.toLocaleString()} words · ${s.corpus.toLocaleString()} corpus`}</title>

          {s.satellites.map((sat, i) => (
            <g key={sat.label + i}>
              <line x1={s.x2} y1={s.y2} x2={sat.x} y2={sat.y} stroke={glyphColor(sat.brightness)} strokeWidth={0.75} opacity={0.5} />
              <circle cx={sat.x} cy={sat.y} r={sat.r} fill={glyphColor(sat.brightness)} opacity={0.85}>
                <title>{`${s.position}-${sat.label}: ${sat.roots.toLocaleString()} roots · ${sat.corpus.toLocaleString()} corpus`}</title>
              </circle>
            </g>
          ))}
        </g>
      ))}

      <circle cx={center.x} cy={center.y} r={26} fill="#0a0a0f" stroke="#eab308" strokeWidth={1.5} />
      <text x={center.x} y={center.y + 10} textAnchor="middle" fontSize={30} fill="#eab308" style={{ fontFamily: 'serif', direction: 'rtl' }}>
        {center.label}
      </text>
    </svg>
  );
}
