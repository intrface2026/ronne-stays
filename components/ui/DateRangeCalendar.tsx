'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  clampToTodayOrAfter,
  formatMonthYear,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  startOfDay,
  toISODate,
  type DateISO,
} from '@/lib/dateUtils';

type Range = { start: Date | null; end: Date | null };

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function getMonthGrid(month: Date, weekStartsOn: 0 | 1 = 0) {
  const first = startOfMonth(month);
  const firstWeekday = first.getDay(); // 0..6 (Sun..Sat)
  const offset = (firstWeekday - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function inRange(d: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  const t = startOfDay(d).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime();
}

export function DateRangeCalendar({
  value,
  onChange,
}: {
  value: { checkIn: DateISO | ''; checkOut: DateISO | '' };
  onChange: (next: { checkIn: DateISO | ''; checkOut: DateISO | '' }) => void;
}) {
  const start = React.useMemo(() => (value.checkIn ? new Date(`${value.checkIn}T00:00:00`) : null), [value.checkIn]);
  const end = React.useMemo(() => (value.checkOut ? new Date(`${value.checkOut}T00:00:00`) : null), [value.checkOut]);

  const today = startOfDay(new Date());
  const initialMonth = start ? startOfMonth(start) : startOfMonth(today);
  const [month, setMonth] = React.useState(() => initialMonth);
  const [hovered, setHovered] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (start) setMonth(startOfMonth(start));
  }, [start]);

  const range: Range = { start, end };
  const previewEnd = range.start && !range.end && hovered && !isBeforeDay(hovered, range.start) ? hovered : range.end;

  const onPick = (dRaw: Date) => {
    const d = clampToTodayOrAfter(dRaw);
    if (!range.start || (range.start && range.end)) {
      onChange({ checkIn: toISODate(d), checkOut: '' });
      return;
    }
    if (isBeforeDay(d, range.start)) {
      onChange({ checkIn: toISODate(d), checkOut: '' });
      return;
    }
    onChange({ checkIn: toISODate(range.start), checkOut: toISODate(d) });
  };

  const Month = ({ m }: { m: Date }) => {
    const grid = getMonthGrid(m, 0);
    const dim = daysInMonth(m);

    return (
      <div className="w-full">
        <div className="text-sm font-semibold text-gray-900 mb-3 text-center">{formatMonthYear(m)}</div>
        <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, idx) => (
            <div key={`${w}-${idx}`} className="text-center font-semibold">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d) => {
            const isCurrentMonth = d.getMonth() === m.getMonth() && d.getDate() <= dim;
            const disabled = isBeforeDay(d, today) || !isCurrentMonth;
            const isStart = !!range.start && isSameDay(d, range.start);
            const isEnd = !!previewEnd && isSameDay(d, previewEnd);
            const inside = inRange(d, range.start, previewEnd);
            const outside = !isCurrentMonth;

            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => onPick(d)}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                className={[
                  'h-10 rounded-xl text-sm font-medium transition-colors',
                  outside ? 'text-gray-300' : 'text-gray-900',
                  disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100',
                  inside ? 'bg-gray-100' : '',
                  isStart || isEnd ? 'bg-ronne-green text-white hover:bg-ronne-green-dark' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={d.toDateString()}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-xs text-gray-500">
          {range.start && !range.end ? 'Select a check-out date' : 'Select check-in and check-out'}
        </div>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Month m={month} />
        <Month m={addMonths(month, 1)} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          className="text-xs font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-4"
          onClick={() => onChange({ checkIn: '', checkOut: '' })}
        >
          Clear dates
        </button>
        <div className="text-xs text-gray-500">
          {range.start && range.end && isAfterDay(range.end, range.start) ? 'Ready to search' : ''}
        </div>
      </div>
    </div>
  );
}

