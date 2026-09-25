"use client";

import { useActionState, useState } from "react";
import { setDailyPriority } from "../../actions/priorities";
import { formatDueDate } from "../../lib/format";
import { PILL, priorityLabel } from "../tasks/pill";
import type { StartedItem } from "../../types/db";
import type { ActionResult } from "../../types/tasks";

export default function StartedList({ items, todayFull }: { items: StartedItem[]; todayFull: boolean }) {
  const [notice, setNotice] = useState<string | null>(null);

  function handleResult(result: ActionResult) {
    setNotice(result.success ? null : result.error);
  }

  return (
    <section aria-labelledby="started-heading" className="ext-lg flex flex-col gap-[18px] p-6">
      <div className="flex items-center gap-3.5">
        <div className="circle-inset flex h-11 w-11 shrink-0 items-center justify-center">
          <ClockIcon className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h2 id="started-heading" className="text-[15px] font-semibold">
            Started, not completed
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {notice && (
        <p role="alert" className="px-2 text-xs text-warn">
          {notice}
        </p>
      )}

      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-xs text-muted">Nothing started and unfinished.</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {items.map((item) => (
            <StartedRow
              key={`${item.task_id}-${item.step_id ?? "task"}`}
              item={item}
              todayFull={todayFull}
              onResult={handleResult}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function StartedRow({
  item,
  todayFull,
  onResult,
}: {
  item: StartedItem;
  todayFull: boolean;
  onResult: (result: ActionResult) => void;
}) {
  const [, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await setDailyPriority(prev, formData);
      onResult(result);
      return result;
    },
    null,
  );
  const isStep = item.step_id !== null;
  const title = isStep ? (item.step_title ?? "") : item.task_title;
  const chosen = `chosen ${formatDueDate(item.chosen_date)}`;
  const meta = isStep
    ? `Step ${item.step_position} of ${item.step_count} · ${item.task_title} · ${chosen}`
    : item.task_due_date
      ? `Whole task · ${chosen} · due ${formatDueDate(item.task_due_date)}`
      : `Whole task · ${chosen}`;

  return (
    <li className="group ext-sm flex flex-col gap-2.5 px-3.5 py-3">
      <div className="flex min-h-10 items-center gap-3.5">
        <div className="circle-inset flex h-[38px] w-[38px] shrink-0 items-center justify-center">
          {isStep ? <FlowIcon /> : <ClockIcon className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold break-words">{title}</div>
          <div className="mt-[3px] text-[11px] text-muted">{meta}</div>
        </div>
      </div>
      {/* Always shown under the text, faint until the row is hovered or focused. */}
      <form
        action={formAction}
        className="flex opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <input type="hidden" name="task_id" value={item.task_id} />
        <input type="hidden" name="step_id" value={item.step_id ?? ""} />
        <button type="submit" disabled={pending || todayFull} className={PILL}>
          {priorityLabel(false, todayFull)}
        </button>
      </form>
    </li>
  );
}

function ClockIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-text`}
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function FlowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 fill-none stroke-text"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M8 12h8M12 8v-.01" />
    </svg>
  );
}
