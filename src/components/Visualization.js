import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const Visualization = ({ rootData }) => {
  const ref = useRef();

  useEffect(() => {
    if (rootData) {
      const svg = d3.select(ref.current)
        .attr('width', 600)
        .attr('height', 600)
        .append('g')
        .attr('transform', 'translate(300,300)');

      const root = d3.hierarchy(rootData, d => d.words)
        .sum(d => d.size);

      const treeLayout = d3.tree().size([360, 200]);
      treeLayout(root);

      svg.selectAll('line')
        .data(root.links())
        .enter().append('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .style('stroke', '#ccc');

      svg.selectAll('circle')
        .data(root.descendants())
        .enter().append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 5)
        .style('fill', '#69b3a2');

      svg.selectAll('text')
        .data(root.descendants())
        .enter().append('text')
        .attr('x', d => d.x + 10)
        .attr('y', d => d.y + 3)
        .text(d => d.data.name);
    }
  }, [rootData]);

  return (
    <svg ref={ref}></svg>
  );
};

export default Visualization;
