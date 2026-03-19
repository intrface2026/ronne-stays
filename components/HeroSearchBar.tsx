'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, Users } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import { DateRangeCalendar } from '@/components/ui/DateRangeCalendar';
import { formatShortDateRange, parseISODate, toISODate, type DateISO } from '@/lib/dateUtils';
import { RonneApi } from '@/lib/ronneApi';

type Guests = {
  adults: number;
  children: number;
  infants: number;
  pets: number;
};

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

function Stepper({
  label,
  sublabel,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const decDisabled = value <= min;
  const incDisabled = value >= max;
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{sublabel}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={decDisabled}
          onClick={() => onChange(value - 1)}
          className="w-9 h-9 rounded-full border border-gray-300 text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-900 transition-colors"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="w-6 text-center text-sm text-gray-900 tabular-nums">{value}</div>
        <button
          type="button"
          disabled={incDisabled}
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border border-gray-300 text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-900 transition-colors"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function HeroSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = React.useState<'where' | 'when' | 'who' | null>(null);
  const [locations, setLocations] = React.useState<string[]>(['Arpora', 'Sangolda', 'Nagoa-Bardez', 'Verla']);

  const [where, setWhere] = React.useState(() => searchParams.get('location') ?? '');
  const [dates, setDates] = React.useState<{ checkIn: DateISO | ''; checkOut: DateISO | '' }>(() => {
    const ci = searchParams.get('checkIn');
    const co = searchParams.get('checkOut');
    return {
      checkIn: parseISODate(ci) ? (ci as DateISO) : '',
      checkOut: parseISODate(co) ? (co as DateISO) : '',
    };
  });
  const [guests, setGuests] = React.useState<Guests>(() => {
    const g = Number(searchParams.get('guests') ?? 2);
    const total = Number.isFinite(g) ? clampInt(g, 0, 16) : 2;
    return { adults: Math.max(1, total), children: 0, infants: 0, pets: 0 };
  });

  React.useEffect(() => {
    let cancelled = false;
    RonneApi.listProperties()
      .then((res) => {
        if (cancelled) return;
        const uniq = Array.from(new Set(res.items.map((p) => p.location).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        if (uniq.length) setLocations(uniq);
      })
      .catch(() => {
        // Keep fallback options.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = React.useMemo(() => {
    const q = where.trim().toLowerCase();
    const base = q ? locations.filter((l) => l.toLowerCase().includes(q)) : locations;
    return base.slice(0, 6);
  }, [where, locations]);

  const checkInDate = dates.checkIn ? new Date(`${dates.checkIn}T00:00:00`) : null;
  const checkOutDate = dates.checkOut ? new Date(`${dates.checkOut}T00:00:00`) : null;

  const onSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const location = where.trim();
    const totalGuests = guests.adults + guests.children;

    if (location) params.set('location', location);
    else params.delete('location');

    if (dates.checkIn) params.set('checkIn', dates.checkIn);
    else params.delete('checkIn');
    if (dates.checkOut) params.set('checkOut', dates.checkOut);
    else params.delete('checkOut');

    if (totalGuests > 0) params.set('guests', String(totalGuests));
    else params.delete('guests');

    router.push(`/?${params.toString()}`);
    setOpen(null);
    document.getElementById('properties-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const pillBase =
    'bg-white/95 backdrop-blur-xl md:bg-white rounded-2xl p-4 md:p-3 shadow-2xl flex flex-col md:flex-row items-center gap-3 md:gap-2 max-w-5xl w-full md:w-auto border border-white/20 md:border-none';

  const segmentButton =
    'w-full text-left rounded-xl md:rounded-none px-2 md:px-6 py-2 md:py-3 hover:bg-gray-50 transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className={`${pillBase}`}
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 w-full">
        <Popover
          open={open === 'where'}
          onOpenChange={(v) => setOpen(v ? 'where' : null)}
          className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 md:border-gray-100"
          contentClassName="absolute left-0 top-full mt-3 w-[min(92vw,420px)] rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-black/10 p-4 z-[70]"
          anchor={
            <button
              type="button"
              className={[
                segmentButton,
                open === 'where' ? 'bg-gray-50' : '',
              ].join(' ')}
              aria-label="Where"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Where</div>
                  <div className="text-sm font-medium text-gray-900 truncate">{where || 'Search destinations'}</div>
                </div>
              </div>
            </button>
          }
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 px-4 py-3 focus-within:border-gray-900 transition-colors">
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Search destinations"
                className="w-full outline-none text-sm"
                autoFocus
              />
            </div>
            <div className="text-xs font-semibold tracking-[0.16em] uppercase text-gray-400">Suggested destinations</div>
            <div className="space-y-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setWhere(s);
                    setOpen('when');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-gray-100 text-left"
                >
                  <span className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-gray-900">{s}</span>
                </button>
              ))}
              {suggestions.length === 0 ? <div className="text-sm text-gray-500 px-2 py-2">No matches</div> : null}
            </div>
          </div>
        </Popover>

        <Popover
          open={open === 'when'}
          onOpenChange={(v) => setOpen(v ? 'when' : null)}
          className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 md:border-gray-100"
          contentClassName="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[min(92vw,860px)] rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-black/10 p-5 z-[70]"
          anchor={
            <button
              type="button"
              className={[
                segmentButton,
                open === 'when' ? 'bg-gray-50' : '',
              ].join(' ')}
              aria-label="When"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">When</div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {formatShortDateRange(checkInDate, checkOutDate)}
                  </div>
                </div>
              </div>
            </button>
          }
        >
          <DateRangeCalendar value={dates} onChange={setDates} />
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100"
              onClick={() => setOpen(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-black"
              onClick={() => setOpen('who')}
            >
              Next
            </button>
          </div>
        </Popover>

        <Popover
          open={open === 'who'}
          onOpenChange={(v) => setOpen(v ? 'who' : null)}
          className="w-full md:w-56"
          contentClassName="absolute right-0 top-full mt-3 w-[min(92vw,420px)] rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-black/10 p-5 z-[70]"
          anchor={
            <button
              type="button"
              className={[
                segmentButton,
                open === 'who' ? 'bg-gray-50' : '',
              ].join(' ')}
              aria-label="Who"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Who</div>
                  <div className="text-sm font-medium text-gray-900 truncate">{guestsLabel(guests)}</div>
                </div>
              </div>
            </button>
          }
        >
          <div className="divide-y divide-gray-100">
            <Stepper
              label="Adults"
              sublabel="Ages 13 or above"
              value={guests.adults}
              min={1}
              max={16}
              onChange={(n) => setGuests((g) => ({ ...g, adults: clampInt(n, 1, 16) }))}
            />
            <Stepper
              label="Children"
              sublabel="Ages 2–12"
              value={guests.children}
              min={0}
              max={16}
              onChange={(n) => setGuests((g) => ({ ...g, children: clampInt(n, 0, 16) }))}
            />
            <Stepper
              label="Infants"
              sublabel="Under 2"
              value={guests.infants}
              min={0}
              max={5}
              onChange={(n) => setGuests((g) => ({ ...g, infants: clampInt(n, 0, 5) }))}
            />
            <Stepper
              label="Pets"
              sublabel="Bringing a service animal?"
              value={guests.pets}
              min={0}
              max={5}
              onChange={(n) => setGuests((g) => ({ ...g, pets: clampInt(n, 0, 5) }))}
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-4"
              onClick={() => setGuests({ adults: 1, children: 0, infants: 0, pets: 0 })}
            >
              Clear
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-black"
              onClick={() => setOpen(null)}
            >
              Done
            </button>
          </div>
        </Popover>

        <div className="w-full md:w-auto md:pl-2">
          <motion.button
            type="button"
            onClick={onSearch}
            className="w-full md:w-auto btn-primary rounded-xl p-4 md:px-8 md:py-4 inline-flex items-center justify-center gap-2 mt-1 md:mt-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="w-5 h-5" />
            <span className="md:hidden">Search</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

