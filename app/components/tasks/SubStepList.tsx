"use client";

import { useRef, useState } from "react";
import { setDailyPriority } from "../../actions/priorities";
import { createStep, deleteStep, setStepDone, updateStep } from "../../actions/steps";
import { priorityLabel } from "./pill";
import TitleTextarea from "./TitleTextarea";
import type { Step } from "../../types/db";
import { STEP_GONE, TASK_GONE, type ActionResult } from "../../types/tasks";

const UNEXPECTED = "Could not save. Try again.";
const ICON_BUTTON =
  "flex h-5 w-5 items-center justify-center rounded-md text-muted hover:bg-text/10 hover:text-text disabled:hover:bg-transparent";

type Callbacks = {
  onSavingChange: (saving: boolean) => void;
  onSaved: () => void;
  onGone: (result: ActionResult) => void;
};

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

// Runs one server action with the pop-up's "Saving..." count, and sorts the result into
// saved, gone (the pop-up shows it) or an error for this row.
async function run(action: Action, fields: Record<string, string>, callbacks: Callbacks): Promise<ActionResult> {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) formData.set(name, value);
  callbacks.onSavingChange(true);
  let result: ActionResult;
  try {
    result = await action(null, formData);
  } catch (caught) {
    console.error("A sub-step action failed", caught);
    result = { success: false, error: UNEXPECTED };
  } finally {
    callbacks.onSavingChange(false);
  }
  if (result.success) callbacks.onSaved();
  else if (result.error === STEP_GONE || result.error === TASK_GONE) callbacks.onGone(result);
  return result;
}

type Props = Callbacks & {
  taskId: number;
  parent: Step;
  subs: Step[];
  drafts: number[];
  focusDraft: number | null;
  todayStepIds: number[];
  todayFull: boolean;
  onAddDraft: () => void;
  onDraftDone: (key: number) => void;
};

// A step's sub-progressions as a slim checklist inside its card, with a progress bar under it.
export default function SubStepList({
  taskId,
  parent,
  subs,
  drafts,
  focusDraft,
  todayStepIds,
  todayFull,
  onAddDraft,
  onDraftDone,
  ...callbacks
}: Props) {
  const done = subs.filter((sub) => sub.done === 1).length;

  return (
    <div className="flex flex-col gap-2">
      <ol aria-label={`Sub-steps of ${parent.title}`} className="flex flex-col gap-0.5">
        {subs.map((sub) => (
          <SubRow
            key={sub.id}
            sub={sub}
            alreadyToday={todayStepIds.includes(sub.id)}
            todayFull={todayFull}
            taskId={taskId}
            {...callbacks}
          />
        ))}
        {drafts.map((key) => (
          <DraftRow
            key={key}
            taskId={taskId}
            parentId={parent.id}
            autoFocus={key === focusDraft}
            onDone={(addAnother) => {
              onDraftDone(key);
              if (addAnother) onAddDraft();
            }}
            {...callbacks}
          />
        ))}
      </ol>
      <button
        type="button"
        onClick={onAddDraft}
        className="self-start px-1 py-0.5 text-[11px] font-semibold text-muted hover:text-text"
      >
        + Add sub-step
      </button>
      {subs.length > 0 && (
        <div className="flex flex-col gap-[5px]">
          <div className="h-1 overflow-hidden rounded-sm bg-track">
            <div
              className="h-full rounded-sm bg-done transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${(done / subs.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-muted">
            {done} of {subs.length} done
          </span>
        </div>
      )}
    </div>
  );
}

function TickButton({ done, label, onClick, disabled }: { done: boolean; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={done}
      aria-label={label}
      className={`mt-[3px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
        done ? "border-done bg-done" : "border-track hover:border-muted"
      }`}
    >
      <svg
        viewBox="0 0 12 12"
        className={`h-[9px] w-[9px] fill-none stroke-white transition-opacity ${done ? "opacity-100" : "opacity-0"}`}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 6.2L4.6 9L10 3" />
      </svg>
    </button>
  );
}

function SubRow({
  sub,
  alreadyToday,
  todayFull,
  taskId,
  ...callbacks
}: Callbacks & { sub: Step; alreadyToday: boolean; todayFull: boolean; taskId: number }) {
  const [text, setText] = useState(sub.title);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const savedText = useRef(sub.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const done = sub.done === 1;

  async function act(action: Action, fields: Record<string, string>) {
    setPending(true);
    const result = await run(action, fields, callbacks);
    setPending(false);
    setError(result.success || result.error === STEP_GONE || result.error === TASK_GONE ? null : result.error);
    return result;
  }

  async function save() {
    const trimmed = text.trim();
    if (trimmed === savedText.current) return;
    const result = await act(updateStep, { id: String(sub.id), title: text });
    if (result.success) savedText.current = trimmed;
  }

  return (
    <li className="group/sub flex flex-col rounded-lg px-0.5 py-1 transition-colors hover:bg-text/5">
      <div className="flex items-start gap-2">
        <TickButton
          done={done}
          label={done ? `Mark ${sub.title} as not done` : `Mark ${sub.title} as done`}
          disabled={pending}
          onClick={() => void act(setStepDone, { id: String(sub.id), done: done ? "0" : "1" })}
        />
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            // Enter leaves the field, and leaving the field is what saves it.
            event.preventDefault();
            textareaRef.current?.blur();
          }}
        >
          <TitleTextarea
            textareaRef={textareaRef}
            value={text}
            onValueChange={setText}
            onBlur={() => void save()}
            aria-label="Sub-step"
            autoComplete="off"
            className={`w-full rounded-md bg-transparent px-1 text-xs leading-[1.35] outline-none focus:inset-sm focus:py-1 ${
              done ? "text-muted line-through" : "text-text"
            }`}
          />
        </form>
        {/* The flag stays visible while the sub-step is one of today's priorities; the rest show on hover. */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled={pending || alreadyToday || todayFull}
            onClick={() => void act(setDailyPriority, { task_id: String(taskId), step_id: String(sub.id) })}
            aria-label={`${priorityLabel(alreadyToday, todayFull)}: ${sub.title}`}
            title={priorityLabel(alreadyToday, todayFull)}
            className={`${ICON_BUTTON} transition-opacity ${
              alreadyToday
                ? "text-started opacity-100"
                : "opacity-0 group-focus-within/sub:opacity-100 group-hover/sub:opacity-100"
            }`}
          >
            <svg
              viewBox="0 0 14 14"
              className={`h-3 w-3 stroke-current ${alreadyToday ? "fill-current" : "fill-none"}`}
              strokeWidth={1.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 1.5v11M3 2h7l-1.6 2L10 6H3" />
            </svg>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={(event) => {
              if (confirming) return void act(deleteStep, { id: String(sub.id) });
              // Safari does not focus a clicked button, and blur must reset the confirm step.
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
            aria-label={confirming ? `Confirm delete ${sub.title}` : `Delete ${sub.title}`}
            title={confirming ? undefined : "Delete sub-step"}
            className={
              confirming
                ? "rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-warn hover:bg-text/10"
                : `${ICON_BUTTON} opacity-0 transition-opacity group-focus-within/sub:opacity-100 group-hover/sub:opacity-100`
            }
          >
            {confirming ? (
              "Delete?"
            ) : (
              <svg
                viewBox="0 0 14 14"
                className="h-3 w-3 fill-none stroke-current"
                strokeWidth={1.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2.5 3.5h9M5.3 3.5V2.3a1 1 0 0 1 1-1h1.4a1 1 0 0 1 1 1v1.2M5.8 6.3v4M8.2 6.3v4M3.3 3.5l.6 8a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.6-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="pl-[23px] text-[11px] text-warn">
          {error}
        </p>
      )}
    </li>
  );
}

function DraftRow({
  taskId,
  parentId,
  autoFocus,
  onDone,
  ...callbacks
}: Callbacks & { taskId: number; parentId: number; autoFocus: boolean; onDone: (addAnother: boolean) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  // Enter saves and opens the next empty sub-step, so a list of papers can be typed in one go.
  const addAnother = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function save() {
    const wantsAnother = addAnother.current;
    addAnother.current = false;
    if (saving.current) return;
    // Leaving an empty field removes it.
    if (text.trim() === "") return onDone(false);
    saving.current = true;
    const result = await run(createStep, { task_id: String(taskId), parent_id: String(parentId), title: text }, callbacks);
    saving.current = false;
    // The saved sub-step arrives as a real row after revalidation, so this field goes away.
    if (result.success) onDone(wantsAnother);
    else if (result.error !== STEP_GONE && result.error !== TASK_GONE) setError(result.error);
  }

  return (
    <li className="flex flex-col px-0.5 py-1">
      <div className="flex items-start gap-2">
        <span
          className="mt-[3px] h-[15px] w-[15px] shrink-0 rounded-full border-[1.5px] border-dashed border-track"
          aria-hidden="true"
        />
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            addAnother.current = true;
            textareaRef.current?.blur();
          }}
        >
          <TitleTextarea
            textareaRef={textareaRef}
            value={text}
            onValueChange={setText}
            onBlur={() => void save()}
            autoFocus={autoFocus}
            aria-label="New sub-step"
            placeholder="Type a sub-step"
            autoComplete="off"
            className="inset-sm w-full rounded-lg px-2 py-1.5 text-xs leading-[1.35] text-text outline-none placeholder:text-muted"
          />
        </form>
      </div>
      {error && (
        <p role="alert" className="pl-[23px] text-[11px] text-warn">
          {error}
        </p>
      )}
    </li>
  );
}
