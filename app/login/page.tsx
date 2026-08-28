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
        <div className="text-3xl mb-2">🎀</div>
        <h1 className="font-display italic text-2xl">Welcome to Presently</h1>
        <p className="text-muted text-sm mt-1">
          Never miss a birthday, or the perfect gift for it.
        </p>
      </div>

      {status === 'sent' ? (
        <div className="bg-bow-soft text-bow-dark rounded-2xl px-4 py-3 text-sm text-center">
          Check <strong>{email}</strong> for a magic link to sign in.
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
            className="w-full rounded-xl bg-ribbon text-white text-sm font-medium py-2 shadow-pop hover:bg-ribbon-dark transition-colors disabled:opacity-60 focus-ring"
          >
            {status === 'sending' ? 'Sending link…' : 'Send magic link'}
          </button>
          {status === 'error' && (
            <p className="text-xs text-ribbon-dark text-center">
              Something went wrong — try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
