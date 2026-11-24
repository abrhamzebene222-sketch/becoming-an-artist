import { useEffect, useRef, useState } from 'react';

/** Cycles slides at a steady interval, pausing for interaction and hidden tabs. */
export default function useRotator(count, interval) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);
  useEffect(() => {
    if (count < 2) return undefined;
    const id = setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') setIndex((i) => (i + 1) % count);
    }, interval);
    return () => clearInterval(id);
  }, [count, interval]);
  const pause = {
    onMouseEnter: () => { paused.current = true; },
    onMouseLeave: () => { paused.current = false; },
    onFocus: () => { paused.current = true; },
    onBlur: () => { paused.current = false; },
  };
  return [index, setIndex, pause];
}
