"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PILL } from "./pill";
import { describeRule, localToday, presets, sameRule, WEEKDAY_LONG, weekdayOf, type RepeatRule } from "../../lib/repeat";
import type { RepeatUnit } from "../../types/db";

const UNIT_WORDS: Record<RepeatUnit, [string, string]> = {
  day: ["day", "days"],
  week: ["week", "weeks"],
  month: ["month", "months"],
};
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// One-click repeat choices plus "Custom", like Google Calendar. Writes hidden fields for the
// edit form: repeat_unit (empty = does not repeat), repeat_every, repeat_days, repeat_until.
export default function RepeatPicker({
  value,
  start,
  onChange,
}: {
  value: RepeatRule | null;
  start: string | null;
  onChange: (rule: RepeatRule | null) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const today = localToday();
  const choices = presets(today);
  const presetKey = choices.find((choice) => sameRule(choice.rule, value))?.key ?? "custom";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-muted">Repeat</span>
      <div role="group" aria-label="Repeat" className="flex flex-wrap gap-1.5">
        {choices.map((choice) => (
          <button
            key={choice.key}
            type="button"
            aria-pressed={presetKey === choice.key}
            onClick={() => onChange(choice.rule)}
            className={`${PILL} ${presetKey === choice.key ? "pressed text-open" : ""}`}
          >
            {choice.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={presetKey === "custom"}
          onClick={(event) => {
            // Safari does not focus a clicked button, and the pop-up returns focus to whatever had it.
            event.currentTarget.focus();
            setCustomOpen(true);
          }}
          className={`${PILL} ${presetKey === "custom" ? "pressed text-open" : ""}`}
        >
          Custom…
        </button>
      </div>
      {value && <p className="text-[11px] text-muted">{describeRule(value, start ?? today)}</p>}
      <input type="hidden" name="repeat_unit" value={value?.unit ?? ""} />
      <input type="hidden" name="repeat_every" value={value?.every ?? 1} />
      <input type="hidden" name="repeat_days" value={value?.days.join(",") ?? ""} />
      <input type="hidden" name="repeat_until" value={value?.until ?? ""} />
      {customOpen && (
        <CustomRepeatDialog
          initial={value ?? { unit: "week", every: 1, days: [weekdayOf(today)], until: null }}
          today={today}
          onDone={(rule) => onChange(rule)}
          onClose={() => setCustomOpen(false)}
        />
      )}
    </div>
  );
}

function CustomRepeatDialog({
  initial,
  today,
  onDone,
  onClose,
}: {
  initial: RepeatRule;
  today: string;
  onDone: (rule: RepeatRule) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const everyId = useId();
  const unitId = useId();
  const [every, setEvery] = useState(String(initial.every));
  const [unit, setUnit] = useState<RepeatUnit>(initial.unit);
  const [days, setDays] = useState<number[]>(initial.days.length > 0 ? initial.days : [weekdayOf(today)]);
  const [ends, setEnds] = useState<"never" | "on">(initial.until ? "on" : "never");
  const [until, setUntil] = useState(initial.until ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const count = Number(every);
  const everyValid = Number.isInteger(count) && count >= 1 && count <= 365;
  const daysValid = unit !== "week" || days.length > 0;
  const untilValid = ends === "never" || (until !== "" && until >= today);
  const valid = everyValid && daysValid && untilValid;

  function toggleDay(day: number) {
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()));
  }

  function done() {
    if (!valid) return;
    onDone({ unit, every: count, days: unit === "week" ? days : [], until: ends === "on" ? until : null });
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={onClose}
      onKeyDown={(event) => {
        // Escape closes only this pop-up, not the task's edit form behind it.
        if (event.key === "Escape") event.stopPropagation();
      }}
      onClick={(event) => {
        // Only a click on the dimmed backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="m-auto w-[min(360px,calc(100vw-32px))] bg-transparent p-0 text-text backdrop:bg-black/40"
    >
      <div className="ext-lg flex flex-col gap-5 p-6">
        <h2 id={headingId} className="text-[15px] font-semibold">
          Custom repeat
        </h2>

        <div className="flex items-center gap-2 text-xs">
          <label htmlFor={everyId}>Repeat every</label>
          <input
            id={everyId}
            type="number"
            min={1}
            max={365}
            value={every}
            onChange={(event) => setEvery(event.target.value)}
            className="inset-sm w-14 px-2 py-1.5 text-center text-xs text-text outline-none"
          />
          <label htmlFor={unitId} className="sr-only">
            Unit
          </label>
          <select
            id={unitId}
            value={unit}
            onChange={(event) => setUnit(event.target.value as RepeatUnit)}
            className="inset-sm px-2 py-1.5 text-xs text-text outline-none"
          >
            {(Object.keys(UNIT_WORDS) as RepeatUnit[]).map((key) => (
              <option key={key} value={key}>
                {count === 1 ? UNIT_WORDS[key][0] : UNIT_WORDS[key][1]}
              </option>
            ))}
          </select>
        </div>

        {unit === "week" && (
          <div className="flex flex-col gap-2">
            <span className="text-xs">Repeat on</span>
            <div role="group" aria-label="Repeat on" className="flex gap-1.5">
              {DAY_LETTERS.map((letter, day) => {
                const on = days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    aria-label={WEEKDAY_LONG[day]}
                    onClick={() => toggleDay(day)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ${
                      on ? "bg-open bg-none! text-bg" : "ext-sm"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
            {!daysValid && <p className="text-[11px] text-warn">Pick at least one day.</p>}
          </div>
        )}
        {unit === "month" && (
          <p className="-mt-2 text-[11px] text-muted">Repeats on day {Number(today.slice(8))} of the month, counting from today.</p>
        )}

        <fieldset className="flex flex-col gap-2 text-xs">
          <legend className="mb-2">Ends</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="custom-repeat-ends" checked={ends === "never"} onChange={() => setEnds("never")} />
            Never
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="custom-repeat-ends" checked={ends === "on"} onChange={() => setEnds("on")} />
            On
            <input
              type="date"
              value={until}
              min={today}
              aria-label="End date"
              onChange={(event) => {
                setUntil(event.target.value);
                setEnds("on");
              }}
              className="inset-sm px-2 py-1 text-[11px] text-text outline-none"
            />
          </label>
          {ends === "on" && !untilValid && <p className="text-[11px] text-warn">Pick an end date from today on.</p>}
        </fieldset>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => dialogRef.current?.close()} className={PILL}>
            Cancel
          </button>
          <button type="button" onClick={done} disabled={!valid} className={PILL}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
