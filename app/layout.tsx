import type { Metadata } from 'next';
import { Fraunces, Inter, IBM_Plex_Mono, Pacifico } from 'next/font/google';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});

const logo = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-logo',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Presently — never miss a birthday',
  description: 'Track birthdays, gift ideas, and reminders for the people you care about.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${display.variable} ${logo.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body text-ink min-h-screen flex flex-col">
        <header className="bg-header sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href={user ? '/' : '/login'} className="flex items-center gap-1.5 focus-ring text-white">
              <svg viewBox="-40 -22 80 62" className="w-5 h-5 text-pink" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round">
                <path d="M0,0 C-10,-14 -30,-10 -22,4 C-16,14 -4,10 0,0 C4,10 16,14 22,4 C30,-10 10,-14 0,0 M0,0 C-4,10 -10,26 -20,30 M0,0 C4,10 10,26 20,30" />
              </svg>
              <span className="font-logo text-2xl">Presently</span>
            </Link>
            {user ? (
              <nav className="flex items-center gap-2.5 text-sm">
                <Link href="/" className="text-white border border-white/50 hover:border-white rounded-lg px-3 py-1.5 focus-ring">Upcoming</Link>
                <Link href="/friends" className="text-white border border-white/50 hover:border-white rounded-lg px-3 py-1.5 focus-ring">All friends</Link>
                <Link href="/friends/new" className="bg-white text-header border border-white rounded-lg px-3.5 py-1.5 font-medium hover:bg-pink hover:border-pink transition-colors focus-ring">
                  + Add friend
                </Link>
                <Link href="/settings" className="text-white/70 hover:text-white text-xs focus-ring">Settings</Link>
              </nav>
            ) : (
              <span className="text-xs text-white/70">Not signed in</span>
            )}
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6 flex-1 w-full">{children}</main>
        <footer className="text-center text-xs text-muted py-5">
          Presented by Kaili 𓊆ྀི❤︎𓊇ྀི
        </footer>
      </body>
    </html>
  );
}

