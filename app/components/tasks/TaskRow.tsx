"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { setDailyPriority } from "../../actions/priorities";
import { deleteTask, updateTask } from "../../actions/tasks";
import { formatDueDate } from "../../lib/format";
import { PILL, priorityLabel } from "./pill";
import ProgressionsDialog from "./ProgressionsDialog";
import TitleTextarea from "./TitleTextarea";
import type { Step, Task, TaskStatus } from "../../types/db";
import { TASK_GONE, type ActionResult } from "../../types/tasks";

type OnResult = (result: ActionResult) => void;

// The row's outline carries the same colour as the task's status buttons on its card.
const STATUS_OUTLINE: Record<TaskStatus, string> = {
  open: "border-open",
  started: "border-started",
  done: "border-done",
};

const ICON_BUTTON = "ext-sm flex h-[30px] w-[30px] items-center justify-center rounded-xl active:pressed";
const ICON = "h-3.5 w-3.5 fill-none stroke-text";
const SMALL_PILL = "ext-sm rounded-xl px-2.5 py-2 text-[10px] font-semibold whitespace-nowrap active:pressed";

const MINI_MAX_BOXES = 4;
const MINI_MAX_ARROWS = 3;

type MiniItem = { kind: "box"; step: Step } | { kind: "arrow"; key: string };

// Lays out box, arrow, box, ... in order and starts a new line when the next item would
// go past four boxes or three arrows on the current line, so the overflow moves down.
function miniLines(steps: Step[]): MiniItem[][] {
  const lines: MiniItem[][] = [];
  let line: MiniItem[] = [];
  let boxes = 0;
  let arrows = 0;
  const place = (item: MiniItem) => {
    const full = item.kind === "box" ? boxes === MINI_MAX_BOXES : arrows === MINI_MAX_ARROWS;
    if (full) {
      lines.push(line);
      line = [];
      boxes = 0;
      arrows = 0;
    }
    line.push(item);
    if (item.kind === "box") boxes++;
    else arrows++;
  };
  steps.forEach((step, index) => {
    if (index > 0) place({ kind: "arrow", key: `arrow-${step.id}` });
    place({ kind: "box", step });
  });
  if (line.length > 0) lines.push(line);
  return lines;
}

// A small copy of the progression chart: one rectangle per step, green when done.
function MiniProgression({ steps }: { steps: Step[] }) {
  const done = steps.filter((step) => step.done === 1).length;

  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="sr-only">
        {steps.length} {steps.length === 1 ? "step" : "steps"}, {done} done
      </span>
      {miniLines(steps).map((line, lineIndex) => (
        <span key={lineIndex} className="flex items-center" aria-hidden="true">
          {line.map((item) =>
            item.kind === "arrow" ? (
              <MiniArrow key={item.key} />
            ) : (
              <span
                key={item.step.id}
                className={`inline-block h-2 w-3 rounded-[2px] border ${
                  item.step.done === 1 ? "border-done bg-done" : "border-current"
                }`}
              />
            ),
          )}
        </span>
      ))}
    </span>
  );
}

function MiniArrow() {
  return <span className="mx-[3px] text-[11px] leading-none">&rarr;</span>;
}

export default function TaskRow({
  task,
  steps,
  hasPriority,
  alreadyToday,
  todayStepIds,
  todayFull,
  onResult,
}: {
  task: Task;
  steps: Step[];
  hasPriority: boolean;
  alreadyToday: boolean;
  todayStepIds: number[];
  todayFull: boolean;
  onResult: OnResult;
}) {
  const [editing, setEditing] = useState(false);
  const [progressionsOpen, setProgressionsOpen] = useState(false);
  // The small chart shows top-level steps only; sub-progressions live inside the pop-up.
  const topSteps = steps.filter((step) => step.parent_id === null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  function closeEditor() {
    returnFocus.current = true;
    setEditing(false);
  }

  if (editing) return <EditTaskForm task={task} onClose={closeEditor} onResult={onResult} />;

  return (
    <li
      className={`group ext-sm flex flex-col gap-2.5 border px-3.5 py-3 ${
        hasPriority ? STATUS_OUTLINE[task.status] : "border-transparent"
      }`}
    >
      <div className="flex min-h-10 items-center gap-3.5">
        <div className="circle-inset flex h-[38px] w-[38px] shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 fill-none stroke-text"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 9h8M8 13h5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold break-words">{task.title}</div>
          <div className="mt-[3px] flex items-start gap-3 text-[11px] text-muted">
            {topSteps.length > 0 && <MiniProgression steps={topSteps} />}
            {/* 114px lines the date up with the add form's date field: its 118px width plus the
                form's 10px right padding, minus this row's 14px right padding. */}
            <span className="ml-auto w-[114px] shrink-0 tabular-nums">
              {task.due_date ? formatDueDate(task.due_date) : "dd.mm.yyyy"}
            </span>
          </div>
        </div>
      </div>
      {/* One line, faint until the row is hovered or focused: the pencil sits under the circle
          icon (ml-1 centres its 30px under the 38px circle) and the trash can in the right corner.
          The two pills are a size smaller than elsewhere so all four fit in the column, and the
          four buttons are spread so the three gaps between them are equal. */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          ref={editButtonRef}
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${task.title}`}
          title="Edit"
          className={`${ICON_BUTTON} ml-1`}
        >
          <svg viewBox="0 0 24 24" className={ICON} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16.5 4.5l3 3L8 19H5v-3L16.5 4.5z" />
          </svg>
        </button>
        <SetPriorityButton
          taskId={task.id}
          alreadyToday={alreadyToday}
          todayFull={todayFull}
          onResult={onResult}
        />
        <button
          type="button"
          onClick={(event) => {
            // Safari does not focus a clicked button, and the pop-up returns focus to whatever had it.
            event.currentTarget.focus();
            setProgressionsOpen(true);
          }}
          className={SMALL_PILL}
        >
          Progressions
        </button>
        {/* mr-1 mirrors the pencil's ml-1, so both ends sit the same distance from the edge. */}
        <div className="mr-1 flex">
          <DeleteTaskButton taskId={task.id} title={task.title} onResult={onResult} />
        </div>
      </div>
      {progressionsOpen && (
        <ProgressionsDialog
          task={task}
          steps={steps}
          todayStepIds={todayStepIds}
          todayFull={todayFull}
          onClose={() => setProgressionsOpen(false)}
          onResult={onResult}
        />
      )}
    </li>
  );
}

function SetPriorityButton({
  taskId,
  alreadyToday,
  todayFull,
  onResult,
}: {
  taskId: number;
  alreadyToday: boolean;
  todayFull: boolean;
  onResult: OnResult;
}) {
  const [, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await setDailyPriority(prev, formData);
      onResult(result);
      return result;
    },
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="task_id" value={taskId} />
      <button type="submit" disabled={pending || alreadyToday || todayFull} className={SMALL_PILL}>
        {/* Short words so all four buttons fit on one line in a narrow window. */}
        {priorityLabel(alreadyToday, todayFull, "Daily priority")}
      </button>
    </form>
  );
}

function EditTaskForm({
  task,
  onClose,
  onResult,
}: {
  task: Task;
  onClose: () => void;
  onResult: OnResult;
}) {
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const titleId = useId();
  const dueId = useId();
  const errorId = useId();

  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await updateTask(prev, formData);
      if (result.success || result.error === TASK_GONE) onResult(result);
      if (result.success) onClose();
      return result;
    },
    null,
  );

  const error = state && !state.success ? state.error : null;

  return (
    <li className="ext-sm px-3.5 py-3">
      <form
        action={formAction}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="id" value={task.id} />
        <label htmlFor={titleId} className="sr-only">
          Task title
        </label>
        <TitleTextarea
          id={titleId}
          name="title"
          value={title}
          onValueChange={setTitle}
          autoFocus
          autoComplete="off"
          aria-describedby={error ? errorId : undefined}
          className="inset-sm px-3 py-2 text-[13px] leading-5 font-semibold text-text outline-none"
        />
        <div className="flex items-center gap-2">
          <label htmlFor={dueId} className="text-[11px] text-muted">
            Due date
          </label>
          <input
            id={dueId}
            name="due_date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            aria-describedby={error ? errorId : undefined}
            className="inset-sm px-3 py-1.5 text-[11px] text-text outline-none"
          />
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className={PILL}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={PILL}>
              Save
            </button>
          </div>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-warn">
            {error}
          </p>
        )}
      </form>
    </li>
  );
}

function DeleteTaskButton({ taskId, title, onResult }: { taskId: number; title: string; onResult: OnResult }) {
  const [confirming, setConfirming] = useState(false);
  const [, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await deleteTask(prev, formData);
      setConfirming(false);
      onResult(result);
      return result;
    },
    null,
  );

  return (
    <form
      action={formAction}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setConfirming(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setConfirming(false);
      }}
    >
      <input type="hidden" name="id" value={taskId} />
      {/* One button element whose type flips, so focus is not lost between the two clicks. */}
      <button
        type={confirming ? "submit" : "button"}
        onClick={confirming ? undefined : () => setConfirming(true)}
        disabled={pending}
        aria-label={confirming ? `Confirm delete ${title}` : `Delete ${title}`}
        title={confirming ? undefined : "Delete"}
        className={confirming ? PILL : ICON_BUTTON}
      >
        {/* The second click keeps its words, so a delete is never one stray click. */}
        {confirming ? (
          "Confirm delete"
        ) : (
          <svg viewBox="0 0 24 24" className={ICON} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
          </svg>
        )}
      </button>
    </form>
  );
}
