import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PHON_CLASSES, CLASS_META } from './phonology';

// Radical Network — directed force graph
//
// Nodes  = unique Arabic radicals (28–32), sized by total root involvement
// Edges  = bi-radical pairs (r1 → r2), width = root_count (log-scaled)
// Color  = phonological class (labial / coronal / emphatic / dorsal / guttural)
//
// Key insight: radicals that appear most frequently as r1 are "leaders" —
// they initiate morphological families. Those appearing most as r2 are
// "followers." Radicals that appear densely in both positions are hubs.
//
// OCP signature: edges between same-class nodes should be thinner/fewer
// than edges crossing phonological class boundaries.

export default function NetworkGraph({ data }) {
  const svgRef       = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;

    const w = containerRef.current.offsetWidth;
    const h = containerRef.current.offsetHeight;

    // ── build graph ─────────────────────────────────────────────
    const radicalMap = {};    // id → { r1_count, r2_count, total }
    data.forEach(d => {
      const [r1, r2] = d.pair_key.split('-');
      if (!r1 || !r2) return;
      if (!radicalMap[r1]) radicalMap[r1] = { id: r1, r1_roots: 0, r2_roots: 0 };
      if (!radicalMap[r2]) radicalMap[r2] = { id: r2, r1_roots: 0, r2_roots: 0 };
      radicalMap[r1].r1_roots += d.root_count;
      radicalMap[r2].r2_roots += d.root_count;
    });

    const nodes = Object.values(radicalMap).map(n => ({
      ...n,
      total: n.r1_roots + n.r2_roots,
      phon:  PHON_CLASSES[n.id] || { class: 'unknown', color: '#555' },
    }));

    const maxTotal  = Math.max(...nodes.map(n => n.total));
    const maxRoots  = Math.max(...data.map(d => d.root_count));
    const nodeRScale = d3.scaleSqrt().domain([0, maxTotal]).range([8, 26]);
    const linkWScale = d3.scaleSqrt().domain([0, maxRoots]).range([0.3, 5]);

    const links = data
      .filter(d => d.root_count > 0)
      .map(d => {
        const [source, target] = d.pair_key.split('-');
        return { source, target, value: d.root_count };
      });

    // ── render ───────────────────────────────────────────────────
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', w).attr('height', h);

    // arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 8).attr('refY', 0)
      .attr('markerWidth', 4).attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', 'rgba(255,255,255,0.15)');

    const linkG = svg.append('g');
    const nodeG = svg.append('g');

    const linkSel = linkG.selectAll('line')
      .data(links).join('line')
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', d => linkWScale(d.value))
      .attr('marker-end', 'url(#arrow)');

    const nodeSel = nodeG.selectAll('g')
      .data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    nodeSel.append('circle')
      .attr('r', d => nodeRScale(d.total))
      .attr('fill', d => d.phon.color)
      .attr('fill-opacity', 0.75)
      .attr('stroke', d => d.phon.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5);

    nodeSel.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', d => Math.min(nodeRScale(d.total) * 0.9, 15))
      .style('font-family', 'serif')
      .style('pointer-events', 'none');

    // tooltip on hover
    nodeSel.on('mouseenter', function(ev, d) {
        d3.select('#net-tooltip')
          .style('opacity', 1)
          .html(`
            <div style="font-size:20px;font-family:serif;color:${d.phon.color};margin-bottom:4px">${d.id}</div>
            <div style="color:#888">class: <span style="color:${d.phon.color}">${d.phon.class}</span></div>
            <div style="color:#888">as r1: <span style="color:#22c55e">${d.r1_roots.toLocaleString()} roots</span></div>
            <div style="color:#888">as r2: <span style="color:#3b82f6">${d.r2_roots.toLocaleString()} roots</span></div>
            <div style="color:#888">total: <span style="color:#fff">${d.total.toLocaleString()}</span></div>
          `);
      })
      .on('mouseleave', () => { d3.select('#net-tooltip').style('opacity', 0); });

    // ── simulation ───────────────────────────────────────────────
    const sim = d3.forceSimulation(nodes)
      .force('link',   d3.forceLink(links).id(d => d.id).distance(80).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide(d => nodeRScale(d.total) + 4))
      .on('tick', () => {
        linkSel
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    return () => sim.stop();
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* hover tooltip */}
      <div id="net-tooltip" style={{
        position: 'absolute', top: 16, right: 16, opacity: 0, pointerEvents: 'none',
        background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.75,
        transition: 'opacity 0.1s',
      }} />

      {/* phonological class legend */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(CLASS_META).map(([cls, meta]) => (
          <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
            <span style={{ color: '#555' }}>{meta.label}</span>
            <span style={{ color: '#333', fontFamily: 'serif' }}>{meta.members}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
