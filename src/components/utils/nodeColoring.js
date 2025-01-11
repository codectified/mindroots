// utils/nodeColoring.js
import * as d3 from 'd3';

export function getNodeColor(node, wordShadeMode) {
  if (node.type === 'word') {
    if (wordShadeMode === 'grammatical') {
      switch (node.word_type) {
        case 'phrase': return '#FFCCCC';
        case 'verb':   return '#FF6666';
        case 'noun':   return '#CC0000';
        default:       return '#660000';
      }
    } else if (wordShadeMode === 'ontological') {
      switch (node.classification) {
        case 'Concrete':  return '#CC0000';
        case 'Abstract':  return '#FFCCCC';
        default:          return '#660000';
      }
    }
  }
  // Default color for other node types
  return d3
    .scaleOrdinal()
    .domain(['name', 'word', 'form', 'root'])
    .range(['gold', 'red', 'blue', 'green'])(node.type);
}