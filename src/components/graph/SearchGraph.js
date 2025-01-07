import React from 'react';
import GraphVisualization from './GraphVisualization'; 
import InfoBubble from '../layout/InfoBubble';

const SearchGraph = ({
  graphData,
  onNodeClick,
  infoBubble,
  closeInfoBubble
}) => {
  return (
    <>
      <GraphVisualization data={graphData} onNodeClick={onNodeClick} />
      {infoBubble && (
        <InfoBubble
          className="info-bubble"
          definition={infoBubble.definition}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y}px`,
            left: `${infoBubble.position.x}px`,
            position: 'absolute'
          }}
        />
      )}
    </>
  );
};

export default SearchGraph;