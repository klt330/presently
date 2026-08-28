export function BirthdayBadge({ daysUntil }: { daysUntil: number }) {
  let classes = 'bg-line text-muted';
  let label = `in ${daysUntil} days`;

  if (daysUntil === 0) {
    classes = 'bg-header text-white';
    label = '🎉 today';
  } else if (daysUntil === 1) {
    classes = 'bg-pink text-header';
    label = 'tomorrow';
  } else if (daysUntil <= 7) {
    classes = 'bg-yellow/50 text-ink';
    label = `in ${daysUntil} days`;
  }

  return <span className={`tag-chip ${classes}`}>{label}</span>;
}

