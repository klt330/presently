'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LandingTimeline } from '@/components/LandingTimeline';

function LoginForm({ inputId }: { inputId: string }) {
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

  if (status === 'sent') {
    return (
      <div className="bg-pink text-header-dark rounded-2xl px-4 py-3 text-sm text-center max-w-md mx-auto">
        Check <strong>{email}</strong> for your login link.
        <p className="mt-1.5 text-xs">
          Open it on any device or browser. You&apos;ll land in this same account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor={inputId} className="sr-only">
          Email
        </label>
        <input
          id={inputId}
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus-ring"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-xl bg-header text-white text-sm font-medium px-4 py-2.5 shadow-pop hover:bg-header-dark transition-colors disabled:opacity-60 focus-ring whitespace-nowrap"
        >
          {status === 'sending' ? 'Sending…' : 'Get my login link'}
        </button>
      </div>
      <p className={`text-xs mt-2 text-center ${status === 'error' ? 'text-header-dark' : 'text-muted'}`}>
        {status === 'error'
          ? "That didn't go through. Try again."
          : 'Free. No password, no app to download.'}
      </p>
    </form>
  );
}

function Landing() {
  const callbackError = useSearchParams().get('error');

  return (
    <div className="-mx-4 -my-6 sm:mx-0 sm:my-0 bg-cream sm:rounded-3xl px-5 sm:px-10 py-10 overflow-hidden">
      <section className="relative text-center">
        <div
          aria-hidden="true"
          className="hidden sm:flex absolute right-0 -top-2 h-20 w-20 rotate-12 items-center justify-center rounded-full border-2 border-dashed border-white bg-yellow text-center text-xs font-medium leading-tight"
        >
          a nudge
          <br />7 days
          <br />ahead
        </div>
        <p className="font-logo text-header text-base">for the people you&apos;d never want to forget</p>
        <h1 className="font-display italic text-3xl sm:text-[2.4rem] sm:leading-[2.7rem] mt-2 max-w-lg mx-auto">
          Be the friend that remembers
        </h1>
        <p className="text-md mt-3 mb-5">Here&apos;s how one birthday goes with Presently.</p>

        {callbackError && (
          <div className="border border-header/40 bg-white text-header-dark rounded-2xl px-4 py-3 text-xs mb-3 max-w-md mx-auto text-left">
            <strong>Login didn&apos;t complete.</strong> {callbackError}
            <p className="mt-1">The link may have expired or already been used. Request a new one below.</p>
          </div>
        )}
        <LoginForm inputId="email-top" />
      </section>

      <section aria-label="How it works" className="mt-12">
        <LandingTimeline />
      </section>

      <section className="mt-12 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
        <figure className="relative -rotate-1 rounded bg-pink px-5 pt-5 pb-4">
          <span aria-hidden="true" className="absolute -top-2 left-1/2 -ml-7 h-3.5 w-14 bg-yellow/80" />
          <p className="font-logo text-header text-sm mb-2">a note from Kaili</p>
          <blockquote className="text-sm leading-relaxed space-y-2">
            <p>
              I built Presently because I realised that nothing beats the joy of receiving and gifting
              thoughtful presents. Like when a friend remembers you love matcha and gifts you a matcha
              set, or when you schedule a cross-country delivery to your grandmother abroad in advance,
              then wake up in her timezone to wish her well.
            </p>
            <p>
              I wanted Presently to help me show up as a thoughtful friend, partner, sister, daughter,
              and granddaughter. I hope you find it useful too!
            </p>
          </blockquote>
        </figure>
        <div className="text-center">
          <h2 className="font-display italic text-xl mb-3">Who&apos;s first on your list?</h2>
          <LoginForm inputId="email-bottom" />
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Landing />
    </Suspense>
  );
}
