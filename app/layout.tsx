import type { Metadata } from 'next';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body text-ink min-h-screen">
        <header className="border-b border-line bg-surface/70 backdrop-blur sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 focus-ring">
              <span className="font-display italic font-600 text-xl text-ink">Presently</span>
              <span className="text-base">🎀</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link href="/" className="hover:text-ink focus-ring">Upcoming</Link>
              <Link href="/friends" className="hover:text-ink focus-ring">All friends</Link>
              <Link href="/friends/new" className="px-3 py-1.5 rounded-xl bg-ribbon text-white text-sm font-medium shadow-pop hover:bg-ribbon-dark transition-colors focus-ring">
                + Add friend
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
