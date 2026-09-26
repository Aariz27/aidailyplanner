"use client";

import { useId, useRef, useState } from "react";
import { setDailyPriority } from "../../actions/priorities";
import { createStep, deleteStep, setStepDone, updateStep } from "../../actions/steps";
import { PILL, priorityLabel } from "./pill";
import SubStepList from "./SubStepList";
import TitleTextarea from "./TitleTextarea";
import type { Step } from "../../types/db";
import { STEP_GONE, TASK_GONE, type ActionResult } from "../../types/tasks";

const UNEXPECTED = "Could not save. Try again.";

type Props = {
  taskId: number;
  number: number;
  step: Step | null;
  subSteps: Step[];
  todayStepIds: number[];
  alreadyToday: boolean;
  todayFull: boolean;
  autoFocus: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: () => void;
  onGone: (result: ActionResult) => void;
  onDeleted: () => void;
};

export default function StepBox({
  taskId,
  number,
  step,
  subSteps,
  todayStepIds,
  alreadyToday,
  todayFull,
  autoFocus,
  onSavingChange,
  onSaved,
  onGone,
  onDeleted,
}: Props) {
  const [text, setText] = useState(step?.title ?? "");
  const [error, setError] = useState<string | null>(null);
  const savedText = useRef(step?.title ?? "");
  const saving = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const errorId = useId();
  // Empty sub-step fields, keyed by a local counter like the pop-up's own drafts.
  const nextSubKey = useRef(0);
  const [subDrafts, setSubDrafts] = useState<number[]>([]);
  const [focusSub, setFocusSub] = useState<number | null>(null);
  const showSubs = subSteps.length > 0 || subDrafts.length > 0;

  function addSubDraft() {
    const key = nextSubKey.current++;
    setSubDrafts((current) => [...current, key]);
    setFocusSub(key);
  }

  async function save() {
    const trimmed = text.trim();
    if (saving.current) return;
    // Unchanged saved text, or an empty box that stayed empty, sends nothing.
    if (step ? trimmed === savedText.current : trimmed === "") return;

    const formData = new FormData();
    formData.set("title", text);
    if (step) formData.set("id", String(step.id));
    else formData.set("task_id", String(taskId));

    saving.current = true;
    onSavingChange(true);
    let result: ActionResult;
    try {
      result = step ? await updateStep(null, formData) : await createStep(null, formData);
    } catch (caught) {
      console.error("Saving a step failed", caught);
      result = { success: false, error: UNEXPECTED };
    } finally {
      saving.current = false;
      onSavingChange(false);
    }

    if (result.success) {
      // A new box empties itself; the saved step comes back as its own box after revalidation.
      if (step) savedText.current = trimmed;
      else setText("");
      setError(null);
      onSaved();
    } else if (result.error === STEP_GONE || result.error === TASK_GONE) {
      onGone(result);
    } else {
      setError(result.error);
    }
  }

  return (
    // The card widens to hold the sub-step checklist.
    <div className={`ext-sm flex flex-col gap-2 p-3 transition-[width] motion-reduce:transition-none ${showSubs ? "w-[280px]" : "w-[200px]"}`}>
      <div className="flex items-center gap-2">
        <span
          className={`h-3.5 w-3.5 shrink-0 rounded-full ${step?.done === 1 ? "bg-done" : "circle-inset"}`}
          aria-hidden="true"
        />
        <label htmlFor={fieldId} className="text-[11px] text-muted">
          Step {number}
          {step?.done === 1 && <span className="sr-only"> (done)</span>}
        </label>
      </div>
      <form
        onSubmit={(event) => {
          // Enter leaves the box, and leaving the box is what saves it.
          event.preventDefault();
          textareaRef.current?.blur();
        }}
      >
        <TitleTextarea
          id={fieldId}
          textareaRef={textareaRef}
          value={text}
          onValueChange={setText}
          onBlur={save}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="inset-sm w-full px-3 py-2 text-[13px] leading-5 font-semibold text-text outline-none"
        />
      </form>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-warn">
          {error}
        </p>
      )}
      {step && showSubs && (
        <SubStepList
          taskId={taskId}
          parent={step}
          subs={subSteps}
          drafts={subDrafts}
          focusDraft={focusSub}
          todayStepIds={todayStepIds}
          todayFull={todayFull}
          onAddDraft={addSubDraft}
          onDraftDone={(key) => setSubDrafts((current) => current.filter((draft) => draft !== key))}
          onSavingChange={onSavingChange}
          onSaved={onSaved}
          onGone={onGone}
        />
      )}
      {step && (
        <div className="flex flex-wrap gap-2">
          <SetStepPriorityButton
            taskId={taskId}
            stepId={step.id}
            alreadyToday={alreadyToday}
            todayFull={todayFull}
            onSavingChange={onSavingChange}
            onSaved={onSaved}
            onGone={onGone}
            onError={setError}
          />
          <MarkDoneButton
            step={step}
            followsSubs={subSteps.length > 0}
            onSavingChange={onSavingChange}
            onSaved={onSaved}
            onGone={onGone}
            onError={setError}
          />
          {/* Once the checklist shows, its own "+ Add sub-step" takes over from this pill. */}
          {!showSubs && (
            <button type="button" onClick={addSubDraft} className={`${PILL} self-start`}>
              Add sub-progressions
            </button>
          )}
          <DeleteStepButton stepId={step.id} onDeleted={onDeleted} onGone={onGone} onError={setError} />
        </div>
      )}
    </div>
  );
}

type SetPriorityProps = {
  taskId: number;
  stepId: number;
  alreadyToday: boolean;
  todayFull: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: () => void;
  onGone: (result: ActionResult) => void;
  onError: (error: string | null) => void;
};

function SetStepPriorityButton({
  taskId,
  stepId,
  alreadyToday,
  todayFull,
  onSavingChange,
  onSaved,
  onGone,
  onError,
}: SetPriorityProps) {
  const [pending, setPending] = useState(false);

  async function set() {
    const formData = new FormData();
    formData.set("task_id", String(taskId));
    formData.set("step_id", String(stepId));
    setPending(true);
    onSavingChange(true);
    let result: ActionResult;
    try {
      result = await setDailyPriority(null, formData);
    } catch (caught) {
      console.error("Setting a step as a daily priority failed", caught);
      result = { success: false, error: UNEXPECTED };
    } finally {
      setPending(false);
      onSavingChange(false);
    }

    if (result.success) {
      onError(null);
      onSaved();
    } else if (result.error === STEP_GONE || result.error === TASK_GONE) {
      onGone(result);
    } else {
      onError(result.error);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void set()}
      disabled={pending || alreadyToday || todayFull}
      className={`${PILL} self-start`}
    >
      {priorityLabel(alreadyToday, todayFull)}
    </button>
  );
}

type MarkDoneProps = {
  step: Step;
  // A step with sub-steps is done when all of them are, so its own button is locked.
  followsSubs: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: () => void;
  onGone: (result: ActionResult) => void;
  onError: (error: string | null) => void;
};

function MarkDoneButton({ step, followsSubs, onSavingChange, onSaved, onGone, onError }: MarkDoneProps) {
  const [pending, setPending] = useState(false);
  const done = step.done === 1;

  async function toggle() {
    const formData = new FormData();
    formData.set("id", String(step.id));
    formData.set("done", done ? "0" : "1");
    setPending(true);
    onSavingChange(true);
    let result: ActionResult;
    try {
      result = await setStepDone(null, formData);
    } catch (caught) {
      console.error("Marking a step done failed", caught);
      result = { success: false, error: UNEXPECTED };
    } finally {
      setPending(false);
      onSavingChange(false);
    }

    if (result.success) {
      onError(null);
      onSaved();
    } else if (result.error === STEP_GONE || result.error === TASK_GONE) {
      onGone(result);
    } else {
      onError(result.error);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending || followsSubs}
      title={followsSubs ? "Follows its sub-steps" : undefined}
      aria-pressed={done}
      className={`${PILL} self-start ${done ? "text-done" : ""}`}
    >
      {done ? "Done" : "Mark as done"}
    </button>
  );
}

type DeleteProps = {
  stepId: number;
  onDeleted: () => void;
  onGone: (result: ActionResult) => void;
  onError: (error: string) => void;
};

function DeleteStepButton({ stepId, onDeleted, onGone, onError }: DeleteProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function remove() {
    const formData = new FormData();
    formData.set("id", String(stepId));
    setPending(true);
    let result: ActionResult;
    try {
      result = await deleteStep(null, formData);
    } catch (caught) {
      console.error("Deleting a step failed", caught);
      result = { success: false, error: UNEXPECTED };
    }
    setPending(false);
    setConfirming(false);
    if (result.success) onDeleted();
    else if (result.error === STEP_GONE || result.error === TASK_GONE) onGone(result);
    else onError(result.error);
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        if (confirming) return void remove();
        // Safari does not focus a clicked button, and blur and Escape only reset a focused one.
        event.currentTarget.focus();
        setConfirming(true);
      }}
      onBlur={() => setConfirming(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && confirming) {
          // Cancelling the keydown stops the dialog from closing, so Escape only resets this button.
          event.preventDefault();
          setConfirming(false);
        }
      }}
      disabled={pending}
      className={`${PILL} self-start`}
    >
      {confirming ? "Confirm delete" : "Delete step"}
    </button>
  );
}
