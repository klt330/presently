import { BirthdayBadge } from './BirthdayBadge';

// Display-only previews of a filled-in list. Never saved, so they can't
// trigger reminder emails or need deleting.
const EXAMPLES = [
  { initials: 'M', name: 'Mom', color: '#C2023F', text: '#FFFFFF', days: 4, detail: '3 gift ideas' },
  { initials: 'JC', name: 'Jamie Chen', color: '#F4F26F', text: '#413B3B', days: 12, detail: 'Austin, TX · sorted ✓' },
  { initials: 'SP', name: 'Sam Park', color: '#FFDCEC', text: '#413B3B', days: 41, detail: 'Loves vinyl and cold brew' },
];

export function ExampleFriends() {
  return (
    <section aria-label="Example of a filled-in list">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2.5">
        What it&apos;ll look like
      </h2>
      <div className="space-y-2 opacity-60 pointer-events-none select-none" aria-hidden="true">
        {EXAMPLES.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-3.5 py-3"
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-display font-600 text-md"
              style={{ backgroundColor: f.color, color: f.text }}
            >
              {f.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">🎂</span>
                <span className="font-medium text-md truncate">{f.name}</span>
                <BirthdayBadge daysUntil={f.days} />
              </div>
              <div className="text-xs text-muted mt-0.5 truncate">{f.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">Examples only. They disappear once you add someone.</p>
    </section>
  );
}
