"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { PILL } from "./pill";
import StepBox from "./StepBox";
import type { Step, Task } from "../../types/db";
import { TASK_GONE, type ActionResult } from "../../types/tasks";

// A task with fewer saved steps than this still opens as `[] -> []`.
const MIN_BOXES = 2;

type Props = {
  task: Task;
  steps: Step[];
  todayStepIds: number[];
  todayFull: boolean;
  onClose: () => void;
  onResult: (result: ActionResult) => void;
};

export default function ProgressionsDialog({
  task,
  steps,
  todayStepIds,
  todayFull,
  onClose,
  onResult,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  // Every empty box, keyed by a local counter so a box keeps its typed text when another box saves.
  // The first keys fill the chart up to two boxes; the counter starts past them.
  const nextDraftKey = useRef(MIN_BOXES);
  const [drafts, setDrafts] = useState<number[]>(() =>
    Array.from({ length: Math.max(0, MIN_BOXES - steps.length) }, (_, index) => index),
  );
  const [focusDraft, setFocusDraft] = useState<number | null>(null);
  const [pendingSaves, setPendingSaves] = useState(0);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    // showModal would focus the Close button, which comes first; start in the first box instead.
    dialog.querySelector("textarea")?.focus();
  }, []);

  // Blurring the focused box first makes it save before the dialog closes.
  function blurFocusedBox() {
    const active = document.activeElement;
    if (active instanceof HTMLElement && dialogRef.current?.contains(active)) active.blur();
  }

  function close() {
    blurFocusedBox();
    dialogRef.current?.close();
  }

  function handleSavingChange(isSaving: boolean) {
    setPendingSaves((count) => count + (isSaving ? 1 : -1));
    if (isSaving) setSaved(false);
  }

  function handleSaved(draftKey: number | null) {
    setSaved(true);
    setNotice(null);
    // The saved step arrives as a real box after revalidation, so the draft box goes away.
    if (draftKey !== null) setDrafts((current) => current.filter((key) => key !== draftKey));
  }

  // `steps` here is the list from when Delete was clicked, so it still counts the deleted step.
  function handleDeleted() {
    setNotice(null);
    const key = nextDraftKey.current++;
    setDrafts((current) => (steps.length - 1 + current.length < MIN_BOXES ? [...current, key] : current));
  }

  function handleGone(result: ActionResult) {
    if (result.success) return;
    // A missing task removes this row, and with it this dialog, so the Dumped list shows the message.
    if (result.error === TASK_GONE) onResult(result);
    else setNotice(result.error);
  }

  function addDraft() {
    const key = nextDraftKey.current++;
    setDrafts((current) => [...current, key]);
    setFocusDraft(key);
  }

  const boxes = [
    ...steps.map((step) => ({ key: `step-${step.id}`, step, draftKey: null })),
    ...drafts.map((draftKey) => ({ key: `draft-${draftKey}`, step: null, draftKey })),
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={blurFocusedBox}
      onClose={onClose}
      onClick={(event) => {
        // Only a click on the dimmed backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) close();
      }}
      className="m-auto w-[min(760px,calc(100vw-32px))] max-w-none bg-transparent p-0 text-text backdrop:bg-black/40"
    >
      <div className="ext-lg flex flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Progressions</p>
            <h2 id={headingId} className="mt-0.5 text-[15px] font-semibold break-words">
              {task.title}
            </h2>
          </div>
          <button type="button" onClick={close} className={PILL}>
            Close
          </button>
        </div>
        <p aria-live="polite" className="-mt-3 min-h-4 text-xs text-muted">
          {pendingSaves > 0 ? "Saving..." : saved ? "Saved" : ""}
        </p>
        {notice && (
          <p role="alert" className="-mt-3 text-xs text-warn">
            {notice}
          </p>
        )}
        <ol className="flex flex-wrap items-center gap-y-4">
          {boxes.map((box, index) => (
            <Fragment key={box.key}>
              {index > 0 && <Arrow />}
              <li>
                <StepBox
                  taskId={task.id}
                  number={index + 1}
                  step={box.step}
                  alreadyToday={box.step !== null && todayStepIds.includes(box.step.id)}
                  todayFull={todayFull}
                  autoFocus={box.draftKey !== null && box.draftKey === focusDraft}
                  onSavingChange={handleSavingChange}
                  onSaved={() => handleSaved(box.draftKey)}
                  onGone={handleGone}
                  onDeleted={handleDeleted}
                />
              </li>
            </Fragment>
          ))}
          <li className="flex items-center">
            <Arrow />
            <button
              type="button"
              onClick={addDraft}
              aria-label="Add another step"
              className="ext-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-full active:pressed"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 fill-none stroke-text"
                strokeWidth={1.5}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </li>
        </ol>
      </div>
    </dialog>
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
