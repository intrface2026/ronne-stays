'use client';

import React from 'react';
import { RonneApi, type CreateBookingResponse } from '@/lib/ronneApi';

type Props = {
  propertyId: string;
  propertyName: string;
  pricePerNight: string | number;
  maxGuests: number;
};

const formatINR = (value: string | number) => {
  if (typeof value === 'string') {
    const num = Number(String(value).replace(/[^\d.]/g, ''));
    if (Number.isFinite(num)) return formatINR(num);
    return value;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const diffNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  const ms = b.getTime() - a.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

export default function BookingCard({ propertyId, propertyName, pricePerNight, maxGuests }: Props) {
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [guestsCount, setGuestsCount] = React.useState(1);
  const [guestName, setGuestName] = React.useState('');
  const [guestEmail, setGuestEmail] = React.useState('');
  const [guestPhone, setGuestPhone] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<CreateBookingResponse | null>(null);

  const nights = diffNights(checkIn, checkOut);
  const perNightNum = typeof pricePerNight === 'number' ? pricePerNight : Number(String(pricePerNight).replace(/[^\d.]/g, ''));
  const total = Number.isFinite(perNightNum) ? perNightNum * nights : null;

  const onReserve = async () => {
    setError(null);
    setSuccess(null);

    if (!checkIn || !checkOut) return setError('Please select check-in and check-out dates.');
    if (nights <= 0) return setError('Check-out must be after check-in.');
    if (!guestName.trim()) return setError('Please enter your name.');
    if (!guestEmail.trim()) return setError('Please enter your email.');
    if (guestsCount < 1 || guestsCount > maxGuests) return setError(`Guests must be between 1 and ${maxGuests}.`);

    setLoading(true);
    try {
      const res = await RonneApi.createBooking({
        propertyId,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim() || undefined,
        checkIn,
        checkOut,
        guestsCount,
        notes: notes.trim() || undefined,
      });
      setSuccess(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="bg-white rounded-3xl shadow-xl shadow-black/5 p-6 md:p-7 lg:p-8 self-start sticky lg:top-28">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {typeof pricePerNight === 'number' ? `${formatINR(pricePerNight)}/night` : String(pricePerNight)}
          </div>
          <p className="text-xs text-gray-500">Taxes included · No hidden fees</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3 divide-y divide-gray-200">
        <div className="grid grid-cols-2">
          <label className="px-4 py-3 text-left text-xs">
            <span className="block font-semibold tracking-[0.16em] uppercase text-gray-400 mb-1">Check-in</span>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full text-sm text-gray-900 outline-none bg-transparent"
            />
          </label>
          <label className="px-4 py-3 text-left text-xs border-l border-gray-200">
            <span className="block font-semibold tracking-[0.16em] uppercase text-gray-400 mb-1">Check-out</span>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-sm text-gray-900 outline-none bg-transparent"
            />
          </label>
        </div>

        <label className="px-4 py-3 text-left text-xs">
          <span className="block font-semibold tracking-[0.16em] uppercase text-gray-400 mb-1">Guests</span>
          <select
            value={guestsCount}
            onChange={(e) => setGuestsCount(Number(e.target.value))}
            className="w-full text-sm text-gray-900 outline-none bg-transparent"
          >
            {Array.from({ length: Math.max(1, maxGuests) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2 mb-3">
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
        />
        <input
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
        />
        <input
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          placeholder="Phone (optional)"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={3}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900 resize-none"
        />
      </div>

      {error ? <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div> : null}
      {success ? (
        <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <div className="font-semibold">Booking created</div>
          <div className="mt-1">
            Confirmation code: <span className="font-mono font-semibold">{success.confirmationCode}</span>
          </div>
          <div className="mt-1 text-emerald-800">
            {propertyName} · {success.checkIn} → {success.checkOut}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onReserve}
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white py-3.5 text-sm font-medium hover:bg-black transition-colors disabled:opacity-60 disabled:hover:bg-gray-900"
      >
        {loading ? 'Reserving…' : 'Reserve'}
      </button>

      <p className="mt-2 text-center text-[11px] text-gray-500">You won&apos;t be charged yet</p>

      <div className="mt-4 pt-4 border-t border-dashed border-gray-200 text-[11px] space-y-1 text-gray-500">
        <div className="flex items-center justify-between">
          <span>
            {typeof pricePerNight === 'number' ? formatINR(pricePerNight) : String(pricePerNight)} x {nights || 0} nights
          </span>
          <span>{total === null ? '—' : formatINR(total)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Service fee</span>
          <span>₹0</span>
        </div>
        <div className="flex items-center justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100 mt-2">
          <span>Total before taxes</span>
          <span>{total === null ? '—' : formatINR(total)}</span>
        </div>
      </div>
    </aside>
  );
}

