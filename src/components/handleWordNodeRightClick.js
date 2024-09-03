import React, { useState, useEffect } from 'react';
import { fetchDefinitionsByWord } from '../services/apiService';
import InfoBubble from './InfoBubble';

const HandleWordNodeRightClick = ({ node, L1, L2, position }) => {
  const [infoBubble, setInfoBubble] = useState(null);

  useEffect(() => {
    const handleRightClick = async () => {
      console.log('Handling right-click in HandleWordNodeRightClick');

      if (node.type === 'word') {
        try {
          console.log('Node properties:', node.properties);

          if (node.properties && node.properties.definitions) {
            const definitions = node.properties.definitions; 
            setInfoBubble({ definition: definitions, position });
            console.log('Setting infoBubble state with local definitions:', definitions);
          } else {
            console.log('Definitions not found in node properties. Fetching from API...');
            const fetchedDefinitions = await fetchDefinitionsByWord(node.word_id, L1, L2);
            setInfoBubble({ definition: fetchedDefinitions, position });
            console.log('Fetched definitions from API:', fetchedDefinitions);
          }
        } catch (error) {
          console.error('Error fetching definitions:', error);
        }
      }
    };

    handleRightClick(); // Trigger the right-click logic immediately after rendering

  }, [node, L1, L2, position]);

  const closeInfoBubble = () => {
    setInfoBubble(null);
  };

  return (
    <>
      {infoBubble && (
        <InfoBubble
          definition={infoBubble.definition}
          onClose={closeInfoBubble}
          style={{
            top: `${infoBubble.position.y - 20}px`,  // Adjust the Y position
            left: `${infoBubble.position.x - 10}px`  // Adjust the X position
          }}
        />
      )}
    </>
  );
};

export default HandleWordNodeRightClick;