"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../lib/db";
import { parseId, parseTitle } from "../lib/form";
import { STEP_GONE, TASK_GONE, type ActionResult } from "../types/tasks";

const STEP_REQUIRED = "Type a step first.";
const UNEXPECTED = "Could not save. Try again.";

function gone(error: string): ActionResult {
  revalidatePath("/");
  return { success: false, error };
}

export async function createStep(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const taskId = parseId(formData, "task_id", TASK_GONE);
  if (!taskId.ok) return gone(TASK_GONE);
  const title = parseTitle(formData, STEP_REQUIRED);
  if (!title.ok) return { success: false, error: title.error };

  let created: boolean;
  try {
    const db = getDb();
    created = db.transaction(() => {
      if (!db.prepare("SELECT 1 FROM tasks WHERE id = ?").get(taskId.value)) return false;
      // Position is computed inside the insert so two quick saves never share a position.
      db.prepare(
        "INSERT INTO steps (task_id, position, title) SELECT ?, COALESCE(MAX(position), 0) + 1, ? FROM steps WHERE task_id = ?",
      ).run(taskId.value, title.value, taskId.value);
      return true;
    })();
  } catch (error) {
    console.error("createStep failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (!created) return gone(TASK_GONE);
  revalidatePath("/");
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
  revalidatePath("/");
  return { success: true };
}

export async function deleteStep(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = parseId(formData, "id", STEP_GONE);
  if (!id.ok) return gone(STEP_GONE);

  let deleted: boolean;
  try {
    const db = getDb();
    deleted = db.transaction(() => {
      const step = db.prepare("SELECT task_id, position FROM steps WHERE id = ?").get(id.value) as
        | { task_id: number; position: number }
        | undefined;
      if (!step) return false;
      db.prepare("DELETE FROM steps WHERE id = ?").run(id.value);
      // Close the gap so positions stay 1, 2, 3.
      db.prepare("UPDATE steps SET position = position - 1 WHERE task_id = ? AND position > ?").run(
        step.task_id,
        step.position,
      );
      return true;
    })();
  } catch (error) {
    console.error("deleteStep failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (!deleted) return gone(STEP_GONE);
  revalidatePath("/");
  return { success: true };
}
