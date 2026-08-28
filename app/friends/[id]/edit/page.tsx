import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Friend } from '@/lib/types';
import { FriendForm } from '@/components/FriendForm';
import { updateFriend } from '@/lib/actions';

export default async function EditFriendPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from('friends').select('*').eq('id', params.id).single();

  const friend = data as unknown as Friend | null;
  if (!friend) notFound();

  return (
    <div className="max-w-md">
      <h1 className="font-display italic text-2xl mb-4">Edit {friend.name}</h1>
      <FriendForm friend={friend} action={updateFriend.bind(null, friend.id)} submitLabel="Save changes" />
    </div>
  );
}
