'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { quickAddFriend, type QuickAddState } from '@/lib/actions';
import { COMMON_TIMEZONES } from '@/lib/date-utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "fill" prompts drop the label in as the name (people often save "Mom" as-is);
// the others just nudge with a placeholder since the name is what matters.
const PROMPTS: { label: string; fill?: string; placeholder?: string }[] = [
  { label: 'Mom', fill: 'Mom' },
  { label: 'Dad', fill: 'Dad' },
  { label: 'Partner', placeholder: "Your partner's name" },
  { label: 'Best friend', placeholder: "Your best friend's name" },
  { label: 'Sibling', placeholder: "Your sibling's name" },
  { label: 'Grandparent', placeholder: 'Grandma' },
];

const initialState: QuickAddState = { status: 'idle', message: '', added: 0 };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto rounded-xl bg-header text-white text-sm font-medium px-5 py-2 shadow-pop hover:bg-header-dark transition-colors disabled:opacity-60 focus-ring"
    >
      {pending ? 'Adding…' : 'Add'}
    </button>
  );
}

export function QuickAddFriend({ isEmpty, existingNames }: { isEmpty: boolean; existingNames: string[] }) {
  const [state, formAction] = useFormState(quickAddFriend, initialState);
  const [name, setName] = useState('');
  const [placeholder, setPlaceholder] = useState('Name');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const nameRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    // Default to the user's own timezone, but only one the edit form can show —
    // otherwise editing the friend later would silently change it.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (COMMON_TIMEZONES.some((t) => t.value === tz)) setTimezone(tz);
  }, []);

  useEffect(() => {
    if (state.added === 0) return;
    setName('');
    setPlaceholder('Name');
    setMonth('');
    setDay('');
    setYear('');
    nameRef.current?.focus();
  }, [state.added]);

  const daysInMonth = month ? new Date(2000, Number(month), 0).getDate() : 31;
  const used = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  const prompts = PROMPTS.filter((p) => !p.fill || !used.has(p.fill.toLowerCase()));

  function choosePrompt(p: (typeof PROMPTS)[number]) {
    if (p.fill) {
      setName(p.fill);
      setPlaceholder('Name');
      monthRef.current?.focus();
    } else {
      setName('');
      setPlaceholder(p.placeholder ?? 'Name');
      nameRef.current?.focus();
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-card p-4">
      {isEmpty ? (
        <>
          <h1 className="font-display italic text-xl">Whose birthday do you never want to miss?</h1>
          <p className="text-sm text-muted mt-1">
            Just a name and a birthday. You can add gift ideas and details later.
          </p>
        </>
      ) : (
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Quick add</h2>
      )}

      {prompts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {prompts.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => choosePrompt(p)}
              className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:border-header/40 hover:bg-pink/40 transition-colors focus-ring"
            >
              + {p.label}
            </button>
          ))}
        </div>
      )}

      <form action={formAction} className="mt-3 space-y-2 sm:space-y-0 sm:flex sm:items-end sm:gap-2">
        <input type="hidden" name="timezone" value={timezone} />
        <label className="block sm:flex-1">
          <span className="sr-only">Name</span>
          <input
            ref={nameRef}
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm focus-ring"
          />
        </label>
        <div className="flex gap-2">
          <label className="flex-1 sm:w-32">
            <span className="sr-only">Month</span>
            <select
              ref={monthRef}
              name="month"
              required
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                const max = new Date(2000, Number(e.target.value), 0).getDate();
                if (Number(day) > max) setDay('');
              }}
              className="w-full rounded-xl border border-line px-2 py-2 text-sm bg-white focus-ring"
            >
              <option value="" disabled>Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </label>
          <label className="w-20">
            <span className="sr-only">Day</span>
            <select
              name="day"
              required
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full rounded-xl border border-line px-2 py-2 text-sm bg-white focus-ring"
            >
              <option value="" disabled>Day</option>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </label>
          <label className="w-24">
            <span className="sr-only">Year (optional)</span>
            <input
              name="year"
              inputMode="numeric"
              maxLength={4}
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
              placeholder="Year?"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm focus-ring"
            />
          </label>
        </div>
        <SubmitButton />
      </form>

      <p
        aria-live="polite"
        className={`text-xs mt-2 min-h-4 ${state.status === 'error' ? 'text-header-dark' : 'text-muted'}`}
      >
        {state.message}
      </p>
    </section>
  );
}
