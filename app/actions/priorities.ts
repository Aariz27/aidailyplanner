"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../lib/db";
import { todayDate } from "../lib/priorities";
import { parseId } from "../lib/form";
import type { TaskStatus } from "../types/db";
import {
  ALREADY_TODAY,
  PRIORITY_GONE,
  STEP_GONE,
  TASK_GONE,
  TODAY_FULL,
  type ActionResult,
} from "../types/tasks";

const MAX_PER_DAY = 3;
const UNEXPECTED = "Could not save. Try again.";

function refreshed(error: string): ActionResult {
  revalidatePath("/");
  return { success: false, error };
}

export async function setDailyPriority(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = parseId(formData, "task_id", TASK_GONE);
  if (!taskId.ok) return refreshed(TASK_GONE);

  const rawStepId = formData.get("step_id");
  const wantsStep = typeof rawStepId === "string" && rawStepId !== "";
  const stepId = wantsStep ? parseId(formData, "step_id", STEP_GONE) : null;
  if (stepId && !stepId.ok) return refreshed(STEP_GONE);

  const today = todayDate();
  let problem: string | null;
  try {
    const db = getDb();
    problem = db.transaction(() => {
      if (!db.prepare("SELECT 1 FROM tasks WHERE id = ?").get(taskId.value)) return TASK_GONE;
      if (stepId?.ok) {
        const step = db
          .prepare("SELECT 1 FROM steps WHERE id = ? AND task_id = ?")
          .get(stepId.value, taskId.value);
        if (!step) return STEP_GONE;
      }
      const { count } = db
        .prepare("SELECT COUNT(*) AS count FROM daily_priorities WHERE priority_date = ?")
        .get(today) as { count: number };
      if (count >= MAX_PER_DAY) return TODAY_FULL;
      // The same whole task, or the same step, is never listed twice on one day.
      // SQLite's IS compares a bound NULL, which = would not.
      const repeat = db
        .prepare(
          "SELECT 1 FROM daily_priorities WHERE priority_date = ? AND task_id = ? AND step_id IS ?",
        )
        .get(today, taskId.value, stepId?.ok ? stepId.value : null);
      if (repeat) return ALREADY_TODAY;
      // status and done come from the column defaults, so a new card starts as Open.
      db.prepare(
        "INSERT INTO daily_priorities (priority_date, task_id, step_id) VALUES (?, ?, ?)",
      ).run(today, taskId.value, stepId?.ok ? stepId.value : null);
      return null;
    })();
  } catch (error) {
    // The daily_priorities_max_three trigger is the last guard on the three per day cap.
    if (error instanceof Error && error.message.includes("at most three")) return refreshed(TODAY_FULL);
    console.error("setDailyPriority failed", error);
    return { success: false, error: UNEXPECTED };
  }

  if (problem) return refreshed(problem);
  revalidatePath("/");
  return { success: true };
}

const STATUSES: TaskStatus[] = ["open", "started", "done"];

export async function setDailyPriorityStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = parseId(formData, "id", PRIORITY_GONE);
  if (!id.ok) return refreshed(PRIORITY_GONE);

  const raw = formData.get("status");
  const status = STATUSES.find((value) => value === raw);
  if (!status) {
    console.error("setDailyPriorityStatus got an unknown status", raw);
    return { success: false, error: UNEXPECTED };
  }
  const done = status === "done" ? 1 : 0;

  let found: boolean;
  try {
    const db = getDb();
    found = db.transaction(() => {
      const row = db.prepare("SELECT task_id, step_id FROM daily_priorities WHERE id = ?").get(id.value) as
        | { task_id: number; step_id: number | null }
        | undefined;
      if (!row) return false;
      db.prepare("UPDATE daily_priorities SET status = ?, done = ? WHERE id = ?").run(status, done, id.value);
      if (row.step_id === null) {
        db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, row.task_id);
      } else {
        // A step card never changes its task's status; it only ticks the step itself.
        db.prepare("UPDATE steps SET done = ? WHERE id = ?").run(done, row.step_id);
      }
      return true;
    })();
  } catch (error) {
    console.error("setDailyPriorityStatus failed", error);
    return { success: false, error: UNEXPECTED };
  }

  if (!found) return refreshed(PRIORITY_GONE);
  revalidatePath("/");
  return { success: true };
}

export async function removeDailyPriority(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = parseId(formData, "id", PRIORITY_GONE);
  if (!id.ok) return refreshed(PRIORITY_GONE);

  let changed: number;
  try {
    changed = getDb().prepare("DELETE FROM daily_priorities WHERE id = ?").run(id.value).changes;
  } catch (error) {
    console.error("removeDailyPriority failed", error);
    return { success: false, error: UNEXPECTED };
  }

  if (changed === 0) return refreshed(PRIORITY_GONE);
  revalidatePath("/");
  return { success: true };
}
