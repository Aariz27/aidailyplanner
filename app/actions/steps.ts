"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../lib/db";
import { parseId, parseTitle } from "../lib/form";
import { parentOf, syncParentDone } from "../lib/steps";
import { STEP_GONE, TASK_GONE, type ActionResult } from "../types/tasks";

const STEP_REQUIRED = "Type a step first.";
const UNEXPECTED = "Could not save. Try again.";

function gone(error: string): ActionResult {
  revalidatePath("/", "layout");
  return { success: false, error };
}

export async function createStep(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const taskId = parseId(formData, "task_id", TASK_GONE);
  if (!taskId.ok) return gone(TASK_GONE);
  const title = parseTitle(formData, STEP_REQUIRED);
  if (!title.ok) return { success: false, error: title.error };
  // A parent_id makes this a sub-progression of that step.
  const rawParent = formData.get("parent_id");
  const parent = typeof rawParent === "string" && rawParent !== "" ? parseId(formData, "parent_id", STEP_GONE) : null;
  if (parent && !parent.ok) return gone(STEP_GONE);
  const parentId = parent?.ok ? parent.value : null;

  let problem: string | null;
  try {
    const db = getDb();
    problem = db.transaction(() => {
      if (!db.prepare("SELECT 1 FROM tasks WHERE id = ?").get(taskId.value)) return TASK_GONE;
      // Only a top-level step of the same task can hold sub-progressions (one level deep).
      if (
        parentId !== null &&
        !db.prepare("SELECT 1 FROM steps WHERE id = ? AND task_id = ? AND parent_id IS NULL").get(parentId, taskId.value)
      )
        return STEP_GONE;
      // Position counts among siblings and is computed inside the insert so two quick saves never share one.
      db.prepare(
        "INSERT INTO steps (task_id, parent_id, position, title) SELECT ?, ?, COALESCE(MAX(position), 0) + 1, ? FROM steps WHERE task_id = ? AND parent_id IS ?",
      ).run(taskId.value, parentId, title.value, taskId.value, parentId);
      // A new, unfinished sub-progression makes a done parent not done again.
      syncParentDone(db, parentId);
      return null;
    })();
  } catch (error) {
    console.error("createStep failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (problem) return gone(problem);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateStep(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = parseId(formData, "id", STEP_GONE);
  if (!id.ok) return gone(STEP_GONE);
  const title = parseTitle(formData, STEP_REQUIRED);
  if (!title.ok) return { success: false, error: title.error };

  let changed: number;
  try {
    changed = getDb().prepare("UPDATE steps SET title = ? WHERE id = ?").run(title.value, id.value).changes;
  } catch (error) {
    console.error("updateStep failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (changed === 0) return gone(STEP_GONE);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteStep(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = parseId(formData, "id", STEP_GONE);
  if (!id.ok) return gone(STEP_GONE);

  let deleted: boolean;
  try {
    const db = getDb();
    deleted = db.transaction(() => {
      const step = db.prepare("SELECT task_id, position, parent_id FROM steps WHERE id = ?").get(id.value) as
        | { task_id: number; position: number; parent_id: number | null }
        | undefined;
      if (!step) return false;
      // Deleting a step also deletes its sub-progressions (ON DELETE CASCADE).
      db.prepare("DELETE FROM steps WHERE id = ?").run(id.value);
      // Close the gap among its siblings so positions stay 1, 2, 3.
      db.prepare("UPDATE steps SET position = position - 1 WHERE task_id = ? AND parent_id IS ? AND position > ?").run(
        step.task_id,
        step.parent_id,
        step.position,
      );
      syncParentDone(db, step.parent_id);
      return true;
    })();
  } catch (error) {
    console.error("deleteStep failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (!deleted) return gone(STEP_GONE);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function setStepDone(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = parseId(formData, "id", STEP_GONE);
  if (!id.ok) return gone(STEP_GONE);
  const done = formData.get("done") === "1" ? 1 : 0;

  let changed: number;
  try {
    const db = getDb();
    changed = db.transaction(() => {
      const count = db.prepare("UPDATE steps SET done = ? WHERE id = ?").run(done, id.value).changes;
      syncParentDone(db, parentOf(db, id.value));
      return count;
    })();
  } catch (error) {
    console.error("setStepDone failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (changed === 0) return gone(STEP_GONE);
  revalidatePath("/", "layout");
  return { success: true };
}
