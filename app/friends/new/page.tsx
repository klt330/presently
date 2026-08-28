import { FriendForm } from '@/components/FriendForm';
import { addFriend } from '@/lib/actions';

export default function NewFriendPage() {
  return (
    <div className="max-w-md">
      <h1 className="font-display italic text-2xl mb-4">Add a friend</h1>
      <FriendForm action={addFriend} submitLabel="Save friend" />
    </div>
  );
}
