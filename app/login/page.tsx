'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? 'error' : 'sent');
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-6">
        <svg viewBox="-40 -22 80 62" className="w-7 h-7 mx-auto mb-2 text-header" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round">
          <path d="M0,0 C-10,-14 -30,-10 -22,4 C-16,14 -4,10 0,0 C4,10 16,14 22,4 C30,-10 10,-14 0,0 M0,0 C-4,10 -10,26 -20,30 M0,0 C4,10 10,26 20,30" />
        </svg>
        <h1 className="font-logo text-3xl text-ink">Presently</h1>
        <p className="text-muted text-sm mt-1">
          Never miss a birthday, or the perfect gift for it.
        </p>
      </div>

      {status === 'sent' ? (
        <div className="bg-pink text-header-dark rounded-2xl px-4 py-3 text-sm text-center">
          Check <strong>{email}</strong> for a magic link to sign in.
          <p className="mt-2 text-xs">
            Using Outlook or Hotmail? Its link-scanning can break this — try a Gmail
            or other non-Microsoft address if it doesn't work.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm focus-ring"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full rounded-xl bg-header text-white text-sm font-medium py-2 shadow-pop hover:bg-header-dark transition-colors disabled:opacity-60 focus-ring"
          >
            {status === 'sending' ? 'Sending link…' : 'Send magic link'}
          </button>
          {status === 'error' && (
            <p className="text-xs text-header-dark text-center">
              Something went wrong — try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}


