import type { TaskStatus, TodayPriority } from "../../types/db";

const MAX_PER_DAY = 3;

// The prototype's half circle of tick lines, drawn from the same centre and radii.
const TICKS = 36;
const CENTRE_X = 150;
const CENTRE_Y = 135;
const INNER = 103;
const OUTER = 125;

const TICK_COLOUR: Record<TaskStatus, string> = {
  open: "stroke-open",
  started: "stroke-started",
  done: "stroke-done",
};

// The arc is cut into three equal blocks, one per place in the day. A block takes the
// colour of the daily priority sitting in that place, and stays grey while it is free.
export default function TodayGauge({ priorities }: { priorities: TodayPriority[] }) {
  const count = priorities.length;
  const perBlock = TICKS / MAX_PER_DAY;

  return (
    <section aria-labelledby="today-gauge-heading" className="ext-lg px-6 pt-6 pb-5">
      <div className="flex items-center gap-3.5">
        <div className="circle-inset flex h-11 w-11 shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] fill-none stroke-text"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l3 2" />
          </svg>
        </div>
        <div>
          <h2 id="today-gauge-heading" className="text-[15px] font-semibold">
            Today
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {count} {count === 1 ? "daily priority" : "daily priorities"}
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-1.5 h-[150px] w-[260px]">
        <svg viewBox="0 0 300 150" width="260" height="150" className="absolute top-0 left-0" aria-hidden="true">
          {Array.from({ length: TICKS }, (_, index) => {
            const angle = Math.PI - (index / (TICKS - 1)) * Math.PI;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            // Rounded to a string, because the server and the browser print the raw
            // number with different last digits and React then reports a mismatch.
            const round = (value: number) => value.toFixed(2);
            const priority = priorities[Math.floor(index / perBlock)];
            return (
              <line
                key={index}
                x1={round(CENTRE_X + INNER * cos)}
                y1={round(CENTRE_Y - INNER * sin)}
                x2={round(CENTRE_X + OUTER * cos)}
                y2={round(CENTRE_Y - OUTER * sin)}
                className={priority ? TICK_COLOUR[priority.status] : "stroke-track"}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-center">
          <div className="text-[44px] leading-none font-light text-accent">{count}</div>
          <div className="mt-1 text-xs text-muted">of 3 today</div>
        </div>
      </div>
    </section>
  );
}
