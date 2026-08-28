'use client';

import { useState } from 'react';
import { addGift } from '@/lib/actions';

export function AddGiftForm({ friendId }: { friendId: string }) {
  const [expanded, setExpanded] = useState(false);
  const boundAddGift = addGift.bind(null, friendId);

  return (
    <form
      className="flex flex-col sm:flex-row gap-2"
      action={async (formData) => {
        await boundAddGift(formData);
        setExpanded(false);
      }}
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
        className="rounded-xl bg-bow text-white text-sm font-medium px-4 py-2 hover:bg-bow-dark transition-colors focus-ring whitespace-nowrap"
      >
        + Add
      </button>
    </form>
  );
}
