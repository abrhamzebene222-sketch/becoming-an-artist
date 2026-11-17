import { useEffect, useRef, useState } from 'react';

/**
 * Cycles 0..count-1 every `interval` ms. Pauses while hovered/focused (call the returned handlers)
 * and while the browser tab is hidden, so people can read without the content running away.
 */
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
  const pause = { onMouseEnter: () => { paused.current = true; }, onMouseLeave: () => { paused.current = false; },
    onFocus: () => { paused.current = true; }, onBlur: () => { paused.current = false; } };
  return [index, setIndex, pause];
}
