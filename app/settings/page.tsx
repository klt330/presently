import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="max-w-md">
      <h1 className="font-display italic text-2xl mb-4">Settings</h1>

      <div className="rounded-xl border border-line px-3.5 py-3 mb-4">
        <div className="text-xs text-muted uppercase tracking-wide mb-0.5">Logged in as</div>
        <div className="text-sm font-medium">{user.email}</div>
      </div>

      <form action={signOut}>
        <button className="w-full rounded-xl bg-header text-white text-sm font-medium py-2.5 shadow-pop hover:bg-header-dark transition-colors focus-ring">
          Log out
        </button>
      </form>
    </div>
  );
}
