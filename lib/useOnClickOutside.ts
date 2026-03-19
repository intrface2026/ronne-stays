import * as React from 'react';

export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: (evt: MouseEvent | TouchEvent) => void,
  enabled = true
) {
  React.useEffect(() => {
    if (!enabled) return;

    const listener = (evt: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      if (evt.target && el.contains(evt.target as Node)) return;
      handler(evt);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener, { passive: true });
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}

