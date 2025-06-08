// hooks/useInfoBubbles.js
import { useRef, useState, useCallback } from 'react';
import '../../styles/info-bubble.css';


/**
 * useInfoBubbles
 * Manages an array of InfoBubble state and click positioning logic.
 *
 * Usage:
 *   const {
 *     containerRef,
 *     bubbles,
 *     handleClick,
 *     closeBubble
 *   } = useInfoBubbles();
 *
 *   <div ref={containerRef} style={{ position:'relative', overflow:'auto' }}>
 *     … your content that calls handleClick(node, e) …
 *     {bubbles.map(b => (
 *       <InfoBubble
 *         key={b.id}
 *         definition={b.definition}
 *         onClose={() => closeBubble(b.id)}
 *         style={{ top: `${b.position.y}px`, left: `${b.position.x}px` }}
 *       />
 *     ))}
 *   </div>
 */
export default function useInfoBubbles() {
  const containerRef = useRef(null);
  const [bubbles, setBubbles] = useState([]);

  // Clamps bubble so it doesn't overflow container's right/bottom edges
  const clampToContainer = useCallback((x, y) => {
    const rect = containerRef.current.getBoundingClientRect();
    const maxW = 300; // must match .info-bubble max-width in CSS
    const maxH = 200; // must match .info-bubble max-height in CSS

    let clampedX = x;
    let clampedY = y;
    if (clampedX + maxW > rect.width) {
      clampedX = rect.width - maxW - 8;
    }
    if (clampedY + maxH > rect.height) {
      clampedY = rect.height - maxH - 8;
    }
    return { x: clampedX, y: clampedY };
  }, []);

  // Call this when a node/row is clicked
  const handleClick = useCallback((definition, event) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Use pageX/Y so scrolling is included
    let rawX = event.pageX - rect.left;
    let rawY = event.pageY - rect.top;

    const { x, y } = clampToContainer(rawX, rawY);

    setBubbles((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        definition,
        position: { x, y },
      },
    ]);
  }, [clampToContainer]);

  const closeBubble = useCallback((id) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { containerRef, bubbles, handleClick, closeBubble };
}