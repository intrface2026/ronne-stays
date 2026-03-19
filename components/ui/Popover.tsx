'use client';

import * as React from 'react';
import { useOnClickOutside } from '@/lib/useOnClickOutside';

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  anchor: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Popover({ open, onOpenChange, anchor, children, className, contentClassName }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  useOnClickOutside(ref, () => onOpenChange(false), open);

  return (
    <div ref={ref} className={className ? `relative ${className}` : 'relative'}>
      <div onClick={() => onOpenChange(!open)}>{anchor}</div>
      {open ? (
        <div
          className={
            contentClassName ??
            'absolute left-0 top-full mt-3 w-[min(92vw,420px)] rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-black/10 p-4 z-50'
          }
          role="dialog"
          aria-modal="false"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

