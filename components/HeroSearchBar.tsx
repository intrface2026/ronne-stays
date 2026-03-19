'use client';

// Design intent: Pill-shaped search bar that splits into stacked segments on
// mobile and a single horizontal pill on desktop. Each segment opens a
// well-styled popover panel that is viewport-safe (capped height + scroll).

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatShortDateRange, parseISODate, toISODate, type DateISO } from '@/lib/dateUtils';
import { RonneApi } from '@/lib/ronneApi';
import {
  addDays,
  clampToTodayOrAfter,
  formatMonthYear,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  startOfDay,
} from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

/* ─────────────────────────── types ─────────────────────────── */

type Guests = { adults: number; children: number; infants: number; pets: number };
type OpenPanelKey = 'where' | 'when' | 'who' | null;

/* ─────────────────────────── helpers ────────────────────────── */

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function guestsLabel(g: Guests) {
  const total = g.adults + g.children;
  if (total <= 0) return 'Add guests';
  const parts = [`${total} ${total === 1 ? 'guest' : 'guests'}`];
  if (g.infants) parts.push(`${g.infants} ${g.infants === 1 ? 'infant' : 'infants'}`);
  if (g.pets) parts.push(`${g.pets} ${g.pets === 1 ? 'pet' : 'pets'}`);
  return parts.join(', ');
}

/* ─────────────────────────── Stepper ────────────────────────── */

function Stepper({
  label, sublabel, value, min, max, onChange,
}: {
  label: string; sublabel: string; value: number;
  min: number; max: number; onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{sublabel}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="w-9 h-9 rounded-full border border-gray-300 text-gray-800 disabled:opacity-35 disabled:cursor-not-allowed hover:border-gray-900 transition-colors text-lg leading-none"
          aria-label={`Decrease ${label}`}
        >−</button>
        <div className="w-6 text-center text-sm text-gray-900 tabular-nums">{value}</div>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border border-gray-300 text-gray-800 disabled:opacity-35 disabled:cursor-not-allowed hover:border-gray-900 transition-colors text-lg leading-none"
          aria-label={`Increase ${label}`}
        >+</button>
      </div>
    </div>
  );
}

/* ───────────────── Mini calendar helpers ─────────────────────── */

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function getMonthGrid(month: Date) {
  const first = startOfMonth(month);
  const offset = first.getDay();
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
function inRange(d: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  const t = startOfDay(d).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime();
}

/* ───────────────── Inline calendar (no separate file) ─────────── */

function CalendarPanel({
  value,
  onChange,
  onDone,
}: {
  value: { checkIn: DateISO | ''; checkOut: DateISO | '' };
  onChange: (v: { checkIn: DateISO | ''; checkOut: DateISO | '' }) => void;
  onDone: () => void;
}) {
  const today = startOfDay(new Date());
  const start = value.checkIn ? new Date(`${value.checkIn}T00:00:00`) : null;
  const end   = value.checkOut ? new Date(`${value.checkOut}T00:00:00`) : null;

  const [month, setMonth] = React.useState(() =>
    start ? startOfMonth(start) : startOfMonth(today)
  );
  const [hovered, setHovered] = React.useState<Date | null>(null);

  const previewEnd =
    start && !end && hovered && !isBeforeDay(hovered, start) ? hovered : end;

  const onPick = (dRaw: Date) => {
    const d = clampToTodayOrAfter(dRaw);
    if (!start || (start && end)) {
      onChange({ checkIn: toISODate(d), checkOut: '' });
      return;
    }
    if (isBeforeDay(d, start)) {
      onChange({ checkIn: toISODate(d), checkOut: '' });
      return;
    }
    onChange({ checkIn: toISODate(start), checkOut: toISODate(d) });
  };

  const MonthGrid = ({ m }: { m: Date }) => {
    const grid = getMonthGrid(m);
    const dim  = daysInMonth(m);
    return (
      <div className="w-full min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-3 text-center">
          {formatMonthYear(m)}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-[10px] text-gray-400 mb-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map((w, i) => (
            <div key={i} className="text-center font-semibold py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {grid.map((d) => {
            const inThisMonth = d.getMonth() === m.getMonth() && d.getDate() <= dim;
            const disabled    = isBeforeDay(d, today) || !inThisMonth;
            const isStart     = !!start && isSameDay(d, start);
            const isEnd       = !!previewEnd && isSameDay(d, previewEnd);
            const inside      = inRange(d, start, previewEnd);
            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => onPick(d)}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'h-9 rounded-lg text-xs font-medium transition-colors',
                  !inThisMonth && 'invisible',
                  disabled    ? 'opacity-40 cursor-not-allowed' : 'hover:bg-ronne-green/10 cursor-pointer',
                  inside      ? 'bg-ronne-green/10' : '',
                  (isStart || isEnd) ? '!bg-ronne-green text-white hover:!bg-ronne-green-dark' : 'text-gray-800',
                )}
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
      {/* Nav row */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setMonth(m => addMonths(m, -1))}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-xs text-gray-500">
          {start && !end ? 'Select check-out date' : 'Select your stay dates'}
        </p>
        <button
          type="button"
          onClick={() => setMonth(m => addMonths(m, 1))}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Months — single on mobile, dual on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <MonthGrid m={month} />
        <div className="hidden sm:block">
          <MonthGrid m={addMonths(month, 1)} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline underline-offset-4"
          onClick={() => onChange({ checkIn: '', checkOut: '' })}
        >
          Clear dates
        </button>
        <div className="flex items-center gap-2">
          {start && end && isAfterDay(end, start) && (
            <span className="text-xs text-gray-400">
              {Math.round((end.getTime() - start.getTime()) / 86_400_000)} nights
            </span>
          )}
          <button
            type="button"
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-ronne-green text-white hover:bg-ronne-green-dark transition-colors"
            onClick={onDone}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Panel wrapper ──────────────────────── */

function Panel({
  open,
  children,
  align = 'left',
}: {
  open: boolean;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'absolute top-[calc(100%+10px)] z-[80]',
            'bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/10',
            'max-h-[80vh] overflow-y-auto',
            'w-[min(92vw,420px)]',
            align === 'left'   && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            align === 'right'  && 'right-0',
          )}
          role="dialog"
          aria-modal="false"
        >
          <div className="p-4 sm:p-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────── Segment button ───────────────────── */

function Segment({
  icon, label, value, active, onClick, divider = true,
}: {
  icon: React.ReactNode; label: string; value: string;
  active: boolean; onClick: () => void; divider?: boolean;
}) {
  return (
    <div className={cn(
      'relative flex-1 min-w-0',
      divider && 'border-b md:border-b-0 md:border-r border-gray-200 md:border-gray-100',
    )}>
      <button
        type="button"
        aria-expanded={active}
        onClick={onClick}
        className={cn(
          'w-full text-left rounded-xl md:rounded-none',
          'px-3 md:px-5 py-2.5 md:py-3',
          'hover:bg-gray-50 transition-colors duration-150',
          active && 'bg-gray-50',
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-400 shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {label}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">{value}</div>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ────────────────────── Main component ─────────────────────── */

export default function HeroSearchBar() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen]     = React.useState<OpenPanelKey>(null);
  const [locations, setLocations] = React.useState<string[]>([
    'Arpora', 'Sangolda', 'Nagoa-Bardez', 'Verla',
  ]);

  const [where, setWhere] = React.useState(() => searchParams.get('location') ?? '');
  const [dates, setDates]  = React.useState<{ checkIn: DateISO | ''; checkOut: DateISO | '' }>(() => {
    const ci = searchParams.get('checkIn');
    const co = searchParams.get('checkOut');
    return {
      checkIn:  parseISODate(ci) ? (ci as DateISO) : '',
      checkOut: parseISODate(co) ? (co as DateISO) : '',
    };
  });
  const [guests, setGuests] = React.useState<Guests>(() => {
    const g = Number(searchParams.get('guests') ?? 2);
    const total = Number.isFinite(g) ? clampInt(g, 0, 16) : 2;
    return { adults: Math.max(1, total), children: 0, infants: 0, pets: 0 };
  });

  /* close on outside click */
  const barRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, []);

  /* fetch real locations */
  React.useEffect(() => {
    let cancelled = false;
    RonneApi.listProperties()
      .then((res) => {
        if (cancelled) return;
        const uniq = Array.from(
          new Set(res.items.map((p) => p.location).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
        if (uniq.length) setLocations(uniq);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const suggestions = React.useMemo(() => {
    const q = where.trim().toLowerCase();
    return (q ? locations.filter((l) => l.toLowerCase().includes(q)) : locations).slice(0, 6);
  }, [where, locations]);

  const checkInDate  = dates.checkIn  ? new Date(`${dates.checkIn}T00:00:00`)  : null;
  const checkOutDate = dates.checkOut ? new Date(`${dates.checkOut}T00:00:00`) : null;

  const onSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const location = where.trim();
    const totalGuests = guests.adults + guests.children;
    if (location)      params.set('location', location); else params.delete('location');
    if (dates.checkIn) params.set('checkIn',  dates.checkIn); else params.delete('checkIn');
    if (dates.checkOut) params.set('checkOut', dates.checkOut); else params.delete('checkOut');
    if (totalGuests > 0) params.set('guests', String(totalGuests)); else params.delete('guests');
    router.push(`/?${params.toString()}`);
    setOpen(null);
    document.getElementById('properties-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggle = (key: OpenPanelKey) => setOpen(prev => (prev === key ? null : key));

  return (
    <motion.div
      ref={barRef}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className={cn(
        'w-full max-w-4xl',
        'bg-white/96 backdrop-blur-xl md:bg-white',
        'rounded-2xl border border-white/30 md:border-gray-150',
        'shadow-2xl shadow-black/10',
        'p-3 md:p-2',
      )}
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center">

        {/* Where */}
        <div className="relative flex-1 min-w-0 border-b md:border-b-0 md:border-r border-gray-200 md:border-gray-100">
          <button
            type="button"
            aria-expanded={open === 'where'}
            onClick={() => toggle('where')}
            className={cn(
              'w-full text-left rounded-xl md:rounded-none',
              'px-3 md:px-5 py-2.5 md:py-3',
              'hover:bg-gray-50 transition-colors duration-150',
              open === 'where' && 'bg-gray-50',
            )}
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Where</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {where || 'Search destinations'}
                </div>
              </div>
            </div>
          </button>

          <Panel open={open === 'where'} align="left">
            {/* Search input */}
            <div className="rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-ronne-green transition-colors mb-3">
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Search destinations…"
                className="w-full outline-none text-sm text-gray-900 placeholder:text-gray-400"
                autoFocus
              />
            </div>
            {/* Suggestions */}
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-2 px-1">
              Suggested
            </div>
            <div className="space-y-0.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setWhere(s); setOpen('when'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
                >
                  <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-gray-900">{s}</span>
                </button>
              ))}
              {!suggestions.length && (
                <div className="text-sm text-gray-400 px-3 py-2">No destinations found</div>
              )}
            </div>
          </Panel>
        </div>

        {/* When */}
        <div className="relative flex-1 min-w-0 border-b md:border-b-0 md:border-r border-gray-200 md:border-gray-100">
          <button
            type="button"
            aria-expanded={open === 'when'}
            onClick={() => toggle('when')}
            className={cn(
              'w-full text-left rounded-xl md:rounded-none',
              'px-3 md:px-5 py-2.5 md:py-3',
              'hover:bg-gray-50 transition-colors duration-150',
              open === 'when' && 'bg-gray-50',
            )}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">When</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {formatShortDateRange(checkInDate, checkOutDate)}
                </div>
              </div>
            </div>
          </button>

          {/* Calendar panel — wider to fit 2 months on sm+ */}
          <AnimatePresence>
            {open === 'when' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={cn(
                  'absolute top-[calc(100%+10px)] z-[80]',
                  'left-0 sm:left-1/2 sm:-translate-x-1/2',
                  'w-[min(92vw,360px)] sm:w-[min(92vw,680px)]',
                  'bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/10',
                  'max-h-[80vh] overflow-y-auto',
                )}
                role="dialog"
                aria-modal="false"
              >
                <div className="p-4 sm:p-5">
                  <CalendarPanel
                    value={dates}
                    onChange={setDates}
                    onDone={() => setOpen('who')}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Who */}
        <div className="relative flex-1 min-w-0">
          <button
            type="button"
            aria-expanded={open === 'who'}
            onClick={() => toggle('who')}
            className={cn(
              'w-full text-left rounded-xl md:rounded-none',
              'px-3 md:px-5 py-2.5 md:py-3',
              'hover:bg-gray-50 transition-colors duration-150',
              open === 'who' && 'bg-gray-50',
            )}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Who</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {guestsLabel(guests)}
                </div>
              </div>
            </div>
          </button>

          <Panel open={open === 'who'} align="right">
            <div className="divide-y divide-gray-100">
              <Stepper label="Adults"   sublabel="Ages 13+"       value={guests.adults}   min={1} max={16} onChange={(n) => setGuests(g => ({ ...g, adults: clampInt(n, 1, 16) }))} />
              <Stepper label="Children" sublabel="Ages 2–12"      value={guests.children} min={0} max={16} onChange={(n) => setGuests(g => ({ ...g, children: clampInt(n, 0, 16) }))} />
              <Stepper label="Infants"  sublabel="Under 2"        value={guests.infants}  min={0} max={5}  onChange={(n) => setGuests(g => ({ ...g, infants: clampInt(n, 0, 5) }))} />
              <Stepper label="Pets"     sublabel="Bringing a pet?" value={guests.pets}    min={0} max={5}  onChange={(n) => setGuests(g => ({ ...g, pets: clampInt(n, 0, 5) }))} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 underline underline-offset-4"
                onClick={() => setGuests({ adults: 1, children: 0, infants: 0, pets: 0 })}
              >
                Clear
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-full text-sm font-semibold bg-ronne-green text-white hover:bg-ronne-green-dark transition-colors"
                onClick={() => setOpen(null)}
              >
                Done
              </button>
            </div>
          </Panel>
        </div>

        {/* Search button */}
        <div className="md:pl-2 pt-2 md:pt-0 shrink-0">
          <motion.button
            type="button"
            onClick={onSearch}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full md:w-auto btn-primary rounded-xl px-5 py-3 md:px-6 md:py-3.5 inline-flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            <span className="md:hidden font-semibold">Search</span>
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}
