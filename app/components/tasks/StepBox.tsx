"use client";

import { useId, useRef, useState } from "react";
import { createStep, deleteStep, updateStep } from "../../actions/steps";
import { PILL } from "./pill";
import TitleTextarea from "./TitleTextarea";
import type { Step } from "../../types/db";
import { STEP_GONE, TASK_GONE, type ActionResult } from "../../types/tasks";

const UNEXPECTED = "Could not save. Try again.";

type Props = {
  taskId: number;
  number: number;
  step: Step | null;
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
    <div className="ext-sm flex w-[200px] flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <span
          className={`h-3.5 w-3.5 shrink-0 rounded-full ${step?.done === 1 ? "bg-accent" : "circle-inset"}`}
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
      {step && <DeleteStepButton stepId={step.id} onDeleted={onDeleted} onGone={onGone} onError={setError} />}
    </div>
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
