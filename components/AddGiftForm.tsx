'use client';

import { useState, useTransition } from 'react';
import { addGift, generateGiftIdeas } from '@/lib/actions';
import type { GiftSuggestion, MagicIdeasResult } from '@/lib/gift-ideas';

function footerNote(meta: Omit<MagicIdeasResult, 'ideas'> | null): string {
  if (!meta) return '';
  if (meta.limitReached) return "You've used today's 15 AI picks, so these are from our classic list. More tomorrow.";
  if (meta.source === 'claude') {
    return meta.remaining === null ? 'Picked by AI from their bio' : `Picked by AI from their bio · ${meta.remaining} left today`;
  }
  return meta.personalized ? '' : 'Tip: add what they love to their bio for more personal ideas.';
}

export function AddGiftForm({ friendId }: { friendId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [ideas, setIdeas] = useState<GiftSuggestion[] | null>(null);
  const [shown, setShown] = useState<string[]>([]);
  const [meta, setMeta] = useState<Omit<MagicIdeasResult, 'ideas'> | null>(null);
  const [savingTitle, setSavingTitle] = useState<string | null>(null);
  const [isThinking, startThinking] = useTransition();
  const [, startSaving] = useTransition();
  const boundAddGift = addGift.bind(null, friendId);

  function loadIdeas() {
    startThinking(async () => {
      const result = await generateGiftIdeas(friendId, shown);
      setIdeas(result.ideas);
      setMeta({ personalized: result.personalized, source: result.source, remaining: result.remaining, limitReached: result.limitReached });
      setShown((prev) => [...prev, ...result.ideas.map((i) => i.title)]);
    });
  }

  function saveIdea(idea: GiftSuggestion) {
    setSavingTitle(idea.title);
    startSaving(async () => {
      const fd = new FormData();
      fd.set('title', idea.title);
      await boundAddGift(fd);
      setIdeas((prev) => prev?.filter((i) => i.title !== idea.title) ?? null);
      setSavingTitle(null);
    });
  }

  function editIdea(idea: GiftSuggestion) {
    setTitle(idea.title);
    setExpanded(true);
  }

  return (
    <div className="space-y-3">
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
          onClick={loadIdeas}
          disabled={isThinking}
          title="Suggest gift ideas from their bio and the occasion"
          className="rounded-xl bg-yellow text-ink text-xs font-semibold px-3.5 py-2 hover:brightness-95 transition disabled:opacity-60 focus-ring whitespace-nowrap"
        >
          {isThinking ? 'Thinking…' : '✨ Magic ideas'}
        </button>
        <button
          type="submit"
          className="rounded-xl bg-header text-white text-sm font-medium px-4 py-2 hover:bg-header-dark transition-colors focus-ring whitespace-nowrap"
        >
          + Add
        </button>
      </form>

      {ideas !== null && (
        <section aria-live="polite" className="rounded-2xl border border-yellow/70 bg-yellow/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">✨ Ideas for them</h3>
            <button
              type="button"
              onClick={() => setIdeas(null)}
              aria-label="Close ideas"
              className="text-muted hover:text-ink text-sm leading-none px-1 focus-ring"
            >
              ×
            </button>
          </div>

          {ideas.length > 0 ? (
            <ul className="space-y-1.5">
              {ideas.map((idea) => (
                <li key={idea.title} className="flex items-center gap-2 rounded-xl bg-white border border-line px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{idea.title}</div>
                    <div className="text-xs text-muted">{idea.reason}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => editIdea(idea)}
                    className="text-xs text-muted hover:text-ink px-1.5 py-1 focus-ring"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => saveIdea(idea)}
                    disabled={savingTitle !== null}
                    className="rounded-lg bg-header text-white text-xs font-medium px-2.5 py-1.5 hover:bg-header-dark transition-colors disabled:opacity-60 focus-ring whitespace-nowrap"
                  >
                    {savingTitle === idea.title ? 'Saving…' : '+ Save'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              That&apos;s every idea for now. Add more about them to their bio for fresh ones.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <p className="text-xs text-muted">{footerNote(meta)}</p>
            <button
              type="button"
              onClick={loadIdeas}
              disabled={isThinking}
              className="text-xs font-medium text-header hover:text-header-dark disabled:opacity-60 focus-ring"
            >
              {isThinking ? 'Thinking…' : 'Show 3 more'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
