'use client';

import { useRef, useState, useTransition } from 'react';
import { addGift } from '@/lib/actions';

export function AddGiftForm({ friendId }: { friendId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  return (
    <form
      ref={formRef}
      className="flex flex-col sm:flex-row gap-2"
      action={(formData) =>
        startTransition(async () => {
          await addGift(friendId, formData);
          formRef.current?.reset();
          setExpanded(false);
        })
      }
    >
      <input
        name="url"
        placeholder="Paste an Amazon or gift link…"
        onFocus={() => setExpanded(true)}
        className="flex-1 rounded-xl border border-line px-3 py-2 text-sm focus-ring"
      />
      {expanded && (
        <input
          name="title"
          placeholder="Or type a gift idea (optional if link added)"
          className="flex-1 rounded-xl border border-line px-3 py-2 text-sm focus-ring"
        />
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-bow text-white text-sm font-medium px-4 py-2 hover:bg-bow-dark transition-colors disabled:opacity-60 focus-ring whitespace-nowrap"
      >
        {isPending ? 'Adding…' : '+ Add'}
      </button>
    </form>
  );
}
