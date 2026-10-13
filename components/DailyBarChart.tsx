export type DailyPoint = { day: string; value: number };

function shortDate(day: string) {
  const [, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(2000, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function DailyBarChart({ title, points, color = '#C2023F' }: { title: string; points: DailyPoint[]; color?: string }) {
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const max = Math.max(1, ...points.map((p) => p.value));
  const width = 300;
  const height = 72;
  const gap = 2;
  const barWidth = (width - gap * (points.length - 1)) / points.length;

  return (
    <figure className="rounded-2xl border border-line bg-surface p-3.5">
      <figcaption className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-muted uppercase tracking-wide">{title}</span>
        <span className="text-sm font-medium">{total.toLocaleString()} in 30 days</span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" role="img" aria-label={`${title}: ${total} in 30 days`} preserveAspectRatio="none">
        {points.map((p, i) => {
          const h = p.value === 0 ? 1 : Math.max(3, (p.value / max) * (height - 4));
          return (
            <rect
              key={p.day}
              x={i * (barWidth + gap)}
              y={height - h}
              width={barWidth}
              height={h}
              rx={1.5}
              fill={p.value === 0 ? '#EEEEEE' : color}
            >
              <title>{`${shortDate(p.day)}: ${p.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-muted mt-1">
        <span>{points.length ? shortDate(points[0].day) : ''}</span>
        <span>peak {max === 1 && total === 0 ? 0 : max}/day</span>
        <span>{points.length ? shortDate(points[points.length - 1].day) : ''}</span>
      </div>
    </figure>
  );
}
