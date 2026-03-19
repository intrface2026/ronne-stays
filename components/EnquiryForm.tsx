'use client';

import React from 'react';
import { RonneApi } from '@/lib/ronneApi';

export default function EnquiryForm() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);

    if (!name.trim()) return setError('Please enter your name.');
    if (!email.trim()) return setError('Please enter your email.');
    if (!message.trim()) return setError('Please enter a message.');

    setLoading(true);
    try {
      await RonneApi.createEnquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim(),
      });
      setSent(true);
      setMessage('');
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : 'Failed to send enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl mx-auto mt-10">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <h3 className="text-xl font-serif text-gray-900">Contact us</h3>
          <p className="text-xs text-gray-500">We typically reply within a few hours.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />
        </div>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
          className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900"
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          rows={4}
          className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-900 resize-none"
        />

        {error ? <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div> : null}
        {sent ? <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">Enquiry sent. We&apos;ll get back to you shortly.</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white py-3.5 text-sm font-medium hover:bg-black transition-colors disabled:opacity-60 disabled:hover:bg-gray-900"
        >
          {loading ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  );
}

