import Link from 'next/link';

export function EmptyState({
  emoji,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  emoji: string;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="text-center py-14 px-4 rounded-2xl border border-dashed border-line">
      <div className="text-3xl mb-2">{emoji}</div>
      <h2 className="font-display italic text-lg mb-1">{title}</h2>
      <p className="text-sm text-muted max-w-xs mx-auto">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-ribbon text-white text-sm font-medium shadow-pop hover:bg-ribbon-dark transition-colors focus-ring"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
