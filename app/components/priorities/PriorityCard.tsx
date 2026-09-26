"use client";

import { useState } from "react";
import { removeDailyPriority, setDailyPriorityStatus } from "../../actions/priorities";
import { formatDueDate } from "../../lib/format";
import { PILL } from "../tasks/pill";
import type { Step, TaskStatus, TodayPriority } from "../../types/db";
import type { ActionResult } from "../../types/tasks";

const UNEXPECTED = "Could not save. Try again.";

// bg-none! removes the dark theme's gradient surface, which otherwise paints over the fill colour.
const STATUS_BUTTONS: { value: TaskStatus; label: string; fill: string; text: string }[] = [
  { value: "open", label: "Open", fill: "bg-open bg-none! text-bg", text: "text-open" },
  { value: "started", label: "Started", fill: "bg-started bg-none! text-bg", text: "text-started" },
  { value: "done", label: "Done", fill: "bg-done bg-none! text-bg", text: "text-done" },
];

type OnResult = (result: ActionResult) => void;

export default function PriorityCard({
  priority,
  steps,
  onResult,
}: {
  priority: TodayPriority;
  steps: Step[];
  onResult: OnResult;
}) {
  const [pending, setPending] = useState(false);
  const isStep = priority.step_id !== null;
  const title = isStep ? (priority.step_title ?? "") : priority.task_title;
  // A sub-progression counts among its siblings and names its parent step.
  const parentId = priority.step_parent_id;
  const siblings = steps.filter((step) => step.parent_id === parentId);
  const parentTitle = parentId === null ? null : steps.find((step) => step.id === parentId)?.title;
  const meta = isStep
    ? parentId === null
      ? `Step ${priority.step_position} of ${siblings.length} · ${priority.task_title}`
      : `Sub-step ${priority.step_position} of ${siblings.length} · ${parentTitle} · ${priority.task_title}`
    : priority.task_due_date
      ? `Whole task · due ${formatDueDate(priority.task_due_date)}`
      : "Whole task";

  async function choose(status: TaskStatus) {
    if (status === priority.status) return;
    const formData = new FormData();
    formData.set("id", String(priority.id));
    formData.set("status", status);
    setPending(true);
    let result: ActionResult;
    try {
      result = await setDailyPriorityStatus(null, formData);
    } catch (caught) {
      console.error("Setting a daily priority status failed", caught);
      result = { success: false, error: UNEXPECTED };
    }
    setPending(false);
    onResult(result);
  }

  return (
    <li className="ext-lg flex flex-col gap-3.5 p-5">
      <div className="flex items-start justify-between">
        <div className="circle-inset flex h-[42px] w-[42px] shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] fill-none stroke-text"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            {isStep ? (
              <>
                <circle cx="6" cy="12" r="2" />
                <circle cx="12" cy="6" r="2" />
                <circle cx="18" cy="12" r="2" />
                <path d="M8 12h8M12 8v-.01" />
              </>
            ) : (
              <>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 9h8M8 13h5" />
              </>
            )}
          </svg>
        </div>
        <RemoveButton priorityId={priority.id} title={title} onResult={onResult} />
      </div>
      <div>
        <div
          className={`text-[17px] font-semibold break-words ${
            priority.status === "done" ? "line-through opacity-50" : ""
          }`}
        >
          {title}
        </div>
        <div className="mt-1 text-xs text-muted">{meta}</div>
        {isStep && <StepFlow steps={siblings} />}
      </div>
      <div role="group" aria-label={`Status of ${title}`} className="flex gap-2">
        {STATUS_BUTTONS.map((button) => {
          const current = priority.status === button.value;
          return (
            <button
              key={button.value}
              type="button"
              aria-pressed={current}
              disabled={pending}
              onClick={() => void choose(button.value)}
              className={`ext-sm rounded-xl px-3.5 py-2 text-[11px] font-semibold whitespace-nowrap ${
                current ? `${button.fill} pressed` : button.text
              }`}
            >
              {button.label}
            </button>
          );
        })}
      </div>
    </li>
  );
}

function RemoveButton({
  priorityId,
  title,
  onResult,
}: {
  priorityId: number;
  title: string;
  onResult: OnResult;
}) {
  const [pending, setPending] = useState(false);

  async function remove() {
    const formData = new FormData();
    formData.set("id", String(priorityId));
    setPending(true);
    let result: ActionResult;
    try {
      result = await removeDailyPriority(null, formData);
    } catch (caught) {
      console.error("Removing a daily priority failed", caught);
      result = { success: false, error: UNEXPECTED };
    }
    setPending(false);
    onResult(result);
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void remove()}
      aria-label={`Remove ${title} from today`}
      className={PILL}
    >
      Remove from today
    </button>
  );
}

// One circle per step of the task, joined by short lines, green when the step is done.
function StepFlow({ steps }: { steps: Step[] }) {
  const done = steps.filter((step) => step.done === 1).length;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-y-2">
      <span className="sr-only">
        {steps.length} {steps.length === 1 ? "step" : "steps"}, {done} done
      </span>
      {steps.map((step, index) => (
        <span key={step.id} className="flex items-center" aria-hidden="true">
          {index > 0 && <span className="h-[2px] w-[22px] shrink-0 bg-track" />}
          <span
            className={`h-3.5 w-3.5 shrink-0 rounded-full ${step.done === 1 ? "bg-done" : "circle-inset"}`}
          />
        </span>
      ))}
    </div>
  );
}
