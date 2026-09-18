import { Fragment } from "react";
import { formatDueDate } from "../../lib/format";
import type { Step, Task, TaskStatus } from "../../types/db";

const STATUS: Record<TaskStatus, { label: string; colour: string }> = {
  open: { label: "Open", colour: "text-open" },
  started: { label: "Started", colour: "text-started" },
  done: { label: "Done", colour: "text-done" },
};

export default function TaskProgression({ task, steps }: { task: Task; steps: Step[] }) {
  const done = steps.filter((step) => step.done === 1).length;
  const headingId = `strategy-task-${task.id}`;

  return (
    <article aria-labelledby={headingId} className="ext-lg flex flex-col gap-4 p-6">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-[15px] font-semibold break-words">
            {task.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {steps.length === 0 ? "No steps yet" : `${done} of ${steps.length} steps done`}
            {task.due_date && ` · due ${formatDueDate(task.due_date)}`}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-semibold ${STATUS[task.status].colour}`}>
          {STATUS[task.status].label}
        </span>
      </div>
      {steps.length > 0 && (
        <ol className="flex flex-wrap items-center gap-y-4">
          {steps.map((step, index) => (
            <Fragment key={step.id}>
              {index > 0 && <Arrow />}
              <li
                className={`max-w-[220px] rounded-[14px] px-3.5 py-2.5 text-xs break-words ${
                  step.done === 1 ? "bg-done text-bg" : "inset-sm"
                }`}
              >
                {step.title}
                {step.done === 1 && <span className="sr-only"> (done)</span>}
              </li>
            </Fragment>
          ))}
        </ol>
      )}
    </article>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 32 12"
      className="mx-2 h-3 w-8 shrink-0 fill-none stroke-muted"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 6h27M24 1.5 29 6l-5 4.5" />
    </svg>
  );
}
