import { createClient } from '@/lib/supabase/server';
import { Friend } from '@/lib/types';
import { FriendCard } from '@/components/FriendCard';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function FriendsPage() {
  const supabase = createClient();
  const { data: friends } = await supabase
    .from('friends')
    .select('*, gifts(*)')
    .order('name');

  const list = (friends ?? []) as unknown as Friend[];

  return (
    <div>
      <h1 className="font-display italic text-2xl mb-4">All friends</h1>
      {list.length === 0 ? (
        <EmptyState
          emoji="📇"
          title="Your friend book is empty"
          body="Adding someone takes a few seconds: just a name and a birthday."
          actionHref="/"
          actionLabel="+ Quick add friends"
        />
      ) : (
        <div className="space-y-2">
          {list.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      )}
    </div>
  );
}
