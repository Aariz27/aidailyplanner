"use client";

import { useActionState, useRef, useState } from "react";
import { createImportantDate, deleteImportantDate } from "../../actions/dates";
import { formatDueDate } from "../../lib/format";
import { PILL } from "../tasks/pill";
import type { ImportantDate } from "../../types/db";
import type { ActionResult } from "../../types/tasks";

export interface DatedItem extends ImportantDate {
  // Whole days from today, negative once the date has passed. Worked out on the server.
  days: number;
}

const SOON = 7;

function whenText(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "yesterday";
  return `${-days} days ago`;
}

function whenColour(days: number): string {
  return days >= 0 && days <= SOON ? "text-warn" : "text-muted";
}

export default function DatesBox({ dates }: { dates: DatedItem[] }) {
  const next = dates.find((date) => date.days >= 0);
  const [notice, setNotice] = useState<string | null>(null);

  function handleResult(result: ActionResult) {
    setNotice(result.success ? null : result.error);
  }

  return (
    <section aria-label="Important dates" className="flex w-[340px] shrink-0 flex-col gap-3.5">
      <div className="flex items-center gap-3.5">
        <div className="circle-ext flex h-[54px] w-[54px] shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] fill-none stroke-text"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </div>
        <div className="ext-sm flex h-[54px] min-w-0 flex-1 flex-col justify-center px-[18px]">
          {next ? (
            <>
              <div className="truncate text-[13px] font-semibold">Next: {next.label}</div>
              <div className={`mt-0.5 text-xs ${whenColour(next.days)}`}>{whenText(next.days)}</div>
            </>
          ) : (
            <div className="text-[13px] font-semibold">Nothing coming up</div>
          )}
        </div>
      </div>

      <div className="ext-sm flex flex-col gap-3 px-[18px] py-4">
        {dates.length === 0 ? (
          <p className="text-xs text-muted">No important dates yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {dates.map((date) => (
              <li key={date.id} className="group flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold break-words">{date.label}</div>
                    <div className="text-[11px] text-muted tabular-nums">{formatDueDate(date.on_date)}</div>
                  </div>
                  <div className={`min-w-[70px] shrink-0 text-right text-[11px] ${whenColour(date.days)}`}>
                    {whenText(date.days)}
                  </div>
                </div>
                <DeleteDateButton date={date} onResult={handleResult} />
              </li>
            ))}
          </ul>
        )}
        {notice && (
          <p role="alert" className="text-xs text-warn">
            {notice}
          </p>
        )}
        <AddDateForm onResult={handleResult} />
      </div>
    </section>
  );
}

function AddDateForm({ onResult }: { onResult: (result: ActionResult) => void }) {
  const [label, setLabel] = useState("");
  const [onDate, setOnDate] = useState("");
  const labelRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await createImportantDate(prev, formData);
      if (result.success) {
        onResult(result);
        setLabel("");
        setOnDate("");
      }
      labelRef.current?.focus();
      return result;
    },
    null,
  );

  const error = state && !state.success ? state.error : null;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="inset-sm flex items-center gap-2 py-1.5 pr-1.5 pl-3">
        <label htmlFor="new-date-label" className="sr-only">
          Date label
        </label>
        <input
          id="new-date-label"
          ref={labelRef}
          name="label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Add a date"
          autoComplete="off"
          aria-describedby={error ? "new-date-error" : undefined}
          className="min-w-0 flex-1 bg-transparent text-xs text-text outline-none placeholder:text-muted"
        />
        <label htmlFor="new-date-on" className="sr-only">
          Date
        </label>
        <input
          id="new-date-on"
          name="on_date"
          type="date"
          value={onDate}
          onChange={(event) => setOnDate(event.target.value)}
          aria-describedby={error ? "new-date-error" : undefined}
          className="w-[112px] shrink-0 bg-transparent text-[11px] text-muted outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Add date"
          className="ext-sm flex h-7 w-7 shrink-0 items-center justify-center rounded-full active:pressed"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3 fill-none stroke-text"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      {error && (
        <p id="new-date-error" role="alert" className="text-xs text-warn">
          {error}
        </p>
      )}
    </form>
  );
}

function DeleteDateButton({ date, onResult }: { date: ImportantDate; onResult: (result: ActionResult) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [, formAction, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await deleteImportantDate(prev, formData);
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
      // Always shown under the date, faint until the row is hovered or focused.
      className={`flex transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 ${
        confirming ? "" : "opacity-60"
      }`}
    >
      <input type="hidden" name="id" value={date.id} />
      {/* One button element whose type flips, so focus is not lost between the two clicks. */}
      <button
        type={confirming ? "submit" : "button"}
        onClick={
          confirming
            ? undefined
            : (event) => {
                // Safari does not focus a clicked button, and blur must reset the confirm step.
                event.currentTarget.focus();
                setConfirming(true);
              }
        }
        disabled={pending}
        aria-label={confirming ? `Confirm delete ${date.label}` : `Delete ${date.label}`}
        className={PILL}
      >
        {confirming ? "Confirm delete" : "Delete"}
      </button>
    </form>
  );
}
