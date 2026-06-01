import { useEffect, useRef, useState } from 'react';

export function useSize(ref) {
  const [size, setSize] = useState({ w: 800, h: 500 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(ref.current);
    // capture initial size immediately
    setSize({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export const DARK = '#0a0a0f';
