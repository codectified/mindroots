import React from 'react';

const SearchTable = ({
  graphData,
  onNodeClick
}) => {
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Root</th>
          </tr>
        </thead>
        <tbody>
          {graphData.nodes?.map((node) => (
            <tr key={node.id} onClick={(e) => onNodeClick(node, e)}>
              <td>{node.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SearchTable;