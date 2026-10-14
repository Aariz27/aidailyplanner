"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../lib/db";
import { parseDueDate, parseId, parseTitle } from "../lib/form";
import { todayDate } from "../lib/priorities";
import { applyRecurrence } from "../lib/recurrence";
import { ruleFromTask, sameRule, type RepeatRule } from "../lib/repeat";
import type { Task } from "../types/db";
import { TASK_GONE, type ActionResult } from "../types/tasks";

const TITLE_REQUIRED = "Type a task first.";
const BAD_DUE_DATE = "Pick a valid due date.";
const UNEXPECTED = "Could not save. Try again.";
const BAD_REPEAT = "Pick a valid repeat: at least one day for a weekly repeat, and an end date that is not in the past.";

// The Repeat picker's hidden fields. An empty repeat_unit means the task does not repeat.
function parseRepeat(formData: FormData): { ok: true; value: RepeatRule | null } | { ok: false } {
  const unit = formData.get("repeat_unit");
  if (unit === null || unit === "") return { ok: true, value: null };
  if (unit !== "day" && unit !== "week" && unit !== "month") return { ok: false };
  const every = Number(formData.get("repeat_every"));
  if (!Number.isInteger(every) || every < 1 || every > 365) return { ok: false };
  const rawDays = formData.get("repeat_days");
  const days =
    typeof rawDays === "string" && /^[0-6](,[0-6])*$/.test(rawDays) ? [...new Set(rawDays.split(",").map(Number))].sort() : [];
  if (unit === "week" && days.length === 0) return { ok: false };
  const until = parseDueDate(formData, BAD_REPEAT, "repeat_until");
  if (!until.ok || (until.value !== null && until.value < todayDate())) return { ok: false };
  return { ok: true, value: { unit, every, days: unit === "week" ? days : [], until: until.value } };
}

function taskGone(): ActionResult {
  revalidatePath("/", "layout");
  return { success: false, error: TASK_GONE };
}

export async function createTask(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const title = parseTitle(formData, TITLE_REQUIRED);
  if (!title.ok) return { success: false, error: title.error };
  const dueDate = parseDueDate(formData, BAD_DUE_DATE);
  if (!dueDate.ok) return { success: false, error: dueDate.error };

  try {
    getDb().prepare("INSERT INTO tasks (title, due_date) VALUES (?, ?)").run(title.value, dueDate.value);
  } catch (error) {
    console.error("createTask failed", error);
    return { success: false, error: UNEXPECTED };
  }
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateTask(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = parseId(formData, "id", TASK_GONE);
  if (!id.ok) return taskGone();
  const title = parseTitle(formData, TITLE_REQUIRED);
  if (!title.ok) return { success: false, error: title.error };
  const dueDate = parseDueDate(formData, BAD_DUE_DATE);
  if (!dueDate.ok) return { success: false, error: dueDate.error };
  const repeat = parseRepeat(formData);
  if (!repeat.ok) return { success: false, error: BAD_REPEAT };
  const rule = repeat.value;

  let found: boolean;
  try {
    const db = getDb();
    found = db.transaction(() => {
      const current = db
        .prepare("SELECT repeat_unit, repeat_every, repeat_days, repeat_until FROM tasks WHERE id = ?")
        .get(id.value) as Pick<Task, "repeat_unit" | "repeat_every" | "repeat_days" | "repeat_until"> | undefined;
      if (!current) return false;
      db.prepare("UPDATE tasks SET title = ?, due_date = ? WHERE id = ?").run(title.value, dueDate.value, id.value);
      // A new or changed rule starts counting from today and is handled again today.
      if (!sameRule(ruleFromTask(current), rule)) {
        db.prepare(
          `UPDATE tasks SET repeat_unit = ?, repeat_every = ?, repeat_days = ?, repeat_start = ?, repeat_until = ?,
             last_recurred = NULL WHERE id = ?`,
        ).run(
          rule?.unit ?? null,
          rule?.every ?? 1,
          rule && rule.days.length > 0 ? rule.days.join(",") : null,
          rule ? todayDate() : null,
          rule?.until ?? null,
          id.value,
        );
      }
      return true;
    })();
    // Setting a repeat that falls on today adds the task to today's priorities straight away.
    if (found && rule) applyRecurrence();
  } catch (error) {
    console.error("updateTask failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (!found) return taskGone();
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteTask(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = parseId(formData, "id", TASK_GONE);
  if (!id.ok) return taskGone();

  let changed: number;
  try {
    changed = getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id.value).changes;
  } catch (error) {
    console.error("deleteTask failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (changed === 0) return taskGone();
  revalidatePath("/", "layout");
  return { success: true };
}
