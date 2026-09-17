"use client";

import { useActionState, useRef, useState } from "react";
import { createTask } from "../../actions/tasks";
import TitleTextarea from "./TitleTextarea";
import type { ActionResult } from "../../types/tasks";

export default function AddTaskForm({ onResult }: { onResult: (result: ActionResult) => void }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await createTask(prev, formData);
      if (result.success) {
        onResult(result);
        setTitle("");
        setDueDate("");
      }
      titleRef.current?.focus();
      return result;
    },
    null,
  );

  const error = state && !state.success ? state.error : null;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="inset-lg flex min-h-[52px] items-center gap-3 py-2 pr-2.5 pl-2">
        <button
          type="submit"
          disabled={pending}
          aria-label="Add task"
          className="ext-sm flex h-9 w-9 shrink-0 items-center justify-center active:pressed"
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
        <label htmlFor="new-task-title" className="sr-only">
          Task title
        </label>
        <TitleTextarea
          id="new-task-title"
          textareaRef={titleRef}
          name="title"
          value={title}
          onValueChange={setTitle}
          placeholder="Dump a task"
          autoComplete="off"
          aria-invalid={error === "Type a task first." || undefined}
          aria-describedby={error ? "new-task-error" : undefined}
          className="min-w-0 flex-1 bg-transparent py-1 text-[13px] leading-5 text-text outline-none placeholder:text-muted"
        />
        <label htmlFor="new-task-due" className="sr-only">
          Due date (optional)
        </label>
        <input
          id="new-task-due"
          name="due_date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-describedby={error ? "new-task-error" : undefined}
          className="w-[118px] shrink-0 bg-transparent text-[11px] text-muted outline-none"
        />
      </div>
      {error && (
        <p id="new-task-error" role="alert" className="px-2 text-xs text-warn">
          {error}
        </p>
      )}
    </form>
  );
}
