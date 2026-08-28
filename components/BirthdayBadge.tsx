export function BirthdayBadge({ daysUntil }: { daysUntil: number }) {
  let classes = 'bg-line text-muted';
  let label = `in ${daysUntil} days`;

  if (daysUntil === 0) {
    classes = 'bg-ribbon text-white';
    label = '🎉 today';
  } else if (daysUntil === 1) {
    classes = 'bg-ribbon-soft text-ribbon-dark';
    label = 'tomorrow';
  } else if (daysUntil <= 7) {
    classes = 'bg-amber-soft text-ink';
    label = `in ${daysUntil} days`;
  }

  return <span className={`tag-chip ${classes}`}>{label}</span>;
}
