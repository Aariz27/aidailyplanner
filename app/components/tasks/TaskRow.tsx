"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { deleteTask, updateTask } from "../../actions/tasks";
import { formatDueDate } from "../../lib/format";
import TitleTextarea from "./TitleTextarea";
import type { Task } from "../../types/db";
import { TASK_GONE, type ActionResult } from "../../types/tasks";

const PILL = "ext-sm rounded-xl px-3.5 py-2 text-[11px] font-semibold whitespace-nowrap active:pressed";

type OnResult = (result: ActionResult) => void;

export default function TaskRow({ task, onResult }: { task: Task; onResult: OnResult }) {
  const [editing, setEditing] = useState(false);
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
    <li className="group ext-sm relative flex min-h-16 items-center gap-3.5 overflow-hidden px-3.5 py-3">
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
        <div className="mt-[3px] truncate text-[11px] text-muted">
          {task.due_date ? `due ${formatDueDate(task.due_date)}` : "no due date"}
        </div>
      </div>
      <div className="pointer-events-none absolute top-1/2 right-3.5 flex -translate-y-1/2 gap-2 bg-bg opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
        <button ref={editButtonRef} type="button" onClick={() => setEditing(true)} className={PILL}>
          Edit
        </button>
        <DeleteTaskButton taskId={task.id} onResult={onResult} />
      </div>
    </li>
  );
}

function EditTaskForm({ task, onClose, onResult }: { task: Task; onClose: () => void; onResult: OnResult }) {
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

function DeleteTaskButton({ taskId, onResult }: { taskId: number; onResult: OnResult }) {
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
        className={PILL}
      >
        {confirming ? "Confirm delete" : "Delete"}
      </button>
    </form>
  );
}
