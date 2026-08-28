'use client';

import { useState, useTransition } from 'react';
import { addGift, generateGiftIdea } from '@/lib/actions';

export function AddGiftForm({ friendId }: { friendId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();
  const boundAddGift = addGift.bind(null, friendId);

  function handleMagicIdea() {
    startTransition(async () => {
      const idea = await generateGiftIdea(friendId);
      setTitle(idea);
      setExpanded(true);
    });
  }

  return (
    <form
      className="flex flex-wrap gap-2"
      action={async (formData) => {
        await boundAddGift(formData);
        setTitle('');
        setExpanded(false);
      }}
    >
      <input
        name="url"
        placeholder="Paste an Amazon or gift link…"
        onFocus={() => setExpanded(true)}
        className="flex-1 min-w-[140px] rounded-xl border border-line px-3 py-2 text-sm focus-ring"
      />
      {expanded && (
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Or type a gift idea (optional if link added)"
          className="flex-1 min-w-[140px] rounded-xl border border-line px-3 py-2 text-sm focus-ring"
        />
      )}
      <button
        type="button"
        onClick={handleMagicIdea}
        disabled={isPending}
        title="Draft a gift idea based on their bio"
        className="rounded-xl bg-yellow text-ink text-xs font-semibold px-3.5 py-2 hover:brightness-95 transition disabled:opacity-60 focus-ring whitespace-nowrap"
      >
        {isPending ? 'Thinking…' : '✨ Magic idea'}
      </button>
      <button
        type="submit"
        className="rounded-xl bg-header text-white text-sm font-medium px-4 py-2 hover:bg-header-dark transition-colors focus-ring whitespace-nowrap"
      >
        + Add
      </button>
    </form>
  );
}
