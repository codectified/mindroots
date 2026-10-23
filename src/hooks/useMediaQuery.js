import { useEffect, useState } from 'react';

const matches = (query) =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;

// Tracks a CSS media query; re-renders when it starts/stops matching
// (rotation, resizing a desktop window, attaching a mouse to a tablet).
export const useMediaQuery = (query) => {
  const [isMatch, setIsMatch] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setIsMatch(mql.matches);
    onChange();
    // Safari < 14 only has addListener
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return isMatch;
};

// Primary input is a finger, not a mouse (phones, most tablets).
export const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';
export const useIsTouch = () => useMediaQuery(TOUCH_QUERY);
