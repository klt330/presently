import type { ReactNode } from 'react';

function Tape({ color }: { color: 'yellow' | 'pink' }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute -top-2 left-1/2 -ml-7 h-3.5 w-14 ${color === 'yellow' ? 'bg-yellow/80' : 'bg-pink'}`}
    />
  );
}

type Step = {
  when: string;
  whenClass: string;
  title: string;
  body: string;
  sticker: string;
  stickerClass: string;
  tape: 'yellow' | 'pink';
  tilt: string;
  snippet: ReactNode;
};

const STEPS: Step[] = [
  {
    when: 'Today',
    whenClass: 'bg-pink text-header-dark',
    title: 'Add Jamie. March 14.',
    body: 'A name and a birthday. Five seconds, tops.',
    sticker: '✍️',
    stickerClass: 'bg-pink',
    tape: 'yellow',
    tilt: '-rotate-2',
    snippet: (
      <div className="rotate-2">
        <div className="rounded-xl border border-line bg-white p-2.5 text-xs">
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="rounded-full border border-line px-2 py-0.5">+ Mom</span>
            <span className="rounded-full border border-line px-2 py-0.5">+ Best friend</span>
          </div>
          <div className="flex gap-1">
            <span className="flex-1 rounded-lg border border-line px-2 py-1">Jamie</span>
            <span className="rounded-lg border border-line px-2 py-1">Mar 14</span>
            <span className="rounded-lg bg-header text-white px-2.5 py-1">Add</span>
          </div>
        </div>
        <p className="font-logo text-header text-xs mt-1.5 ml-2">that&apos;s the whole form</p>
      </div>
    ),
  },
  {
    when: 'Whenever',
    whenClass: 'bg-yellow/50 text-ink',
    title: 'Save the matcha set she mentioned.',
    body: 'Jot down what she loves. Drop in gift links as you spot them.',
    sticker: '💛',
    stickerClass: 'bg-yellow',
    tape: 'pink',
    tilt: 'rotate-[1.5deg]',
    snippet: (
      <div className="-rotate-[1.5deg]">
        <div className="rounded bg-yellow/40 px-3 py-2.5 font-logo text-sm leading-relaxed">
          loves matcha, vinyl, and her dog Miso
        </div>
        <div className="mt-1.5 ml-5 mr-2 flex items-center gap-2 rounded-xl border border-line bg-white px-2 py-1.5 text-xs">
          <span className="h-6 w-6 rounded-md bg-pink" aria-hidden="true" />
          <span className="flex-1">Matcha whisk set</span>
          <span className="text-muted">$38</span>
        </div>
      </div>
    ),
  },
  {
    when: '7 days before',
    whenClass: 'bg-line text-ink',
    title: 'You get a nudge.',
    body: 'One email with her gift ideas and a buy-by date, so there’s time to order, wrap, and write the card.',
    sticker: '💌',
    stickerClass: 'bg-white border-pink',
    tape: 'yellow',
    tilt: 'rotate-1',
    snippet: (
      <div className="-rotate-2 rounded-xl bg-header text-white px-3 py-2.5 text-xs leading-relaxed">
        <div className="text-white/75">Presently · 9:00 AM</div>
        <div className="font-medium">Jamie&apos;s birthday is coming up in a week</div>
        <div className="mt-1">Buy by Mar 9 · Gift ideas: matcha whisk set</div>
      </div>
    ),
  },
  {
    when: 'March 14',
    whenClass: 'bg-header text-white',
    title: 'The gift shows up. So do you.',
    body: 'Even across time zones: Presently counts down in their local time, so you can wish them well on their morning.',
    sticker: '🎁',
    stickerClass: 'bg-header',
    tape: 'pink',
    tilt: '-rotate-1',
    snippet: (
      <div className="text-center -rotate-3">
        <span className="inline-block rounded-full border-2 border-dashed border-header bg-white px-5 py-2 font-logo text-header">
          sorted ✓
        </span>
      </div>
    ),
  },
];

export function LandingTimeline() {
  return (
    <ol className="relative space-y-10 py-4">
      <span
        aria-hidden="true"
        className="absolute top-6 bottom-6 left-5 md:left-1/2 border-l-2 border-dashed border-header/30"
      />
      {STEPS.map((step, i) => {
        const flip = i % 2 === 1;
        return (
          <li
            key={step.when}
            className="relative grid gap-4 pl-14 md:pl-0 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] md:items-center md:gap-5"
          >
            <div className={`relative rounded border border-line bg-white px-4 pt-4 pb-3.5 ${step.tilt} ${flip ? 'md:order-3' : 'md:order-1'}`}>
              <Tape color={step.tape} />
              <span className={`tag-chip ${step.whenClass}`}>{step.when}</span>
              <h3 className="font-display italic text-lg mt-1.5">{step.title}</h3>
              <p className="text-sm text-muted mt-0.5">{step.body}</p>
            </div>
            <div
              aria-hidden="true"
              className={`absolute left-0 top-0 md:static md:order-2 flex h-10 w-10 md:mx-auto items-center justify-center rounded-full border-2 border-white text-lg ${step.stickerClass}`}
            >
              {step.sticker}
            </div>
            <div className={flip ? 'md:order-1' : 'md:order-3'}>{step.snippet}</div>
          </li>
        );
      })}
    </ol>
  );
}
