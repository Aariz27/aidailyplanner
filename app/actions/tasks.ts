"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../lib/db";
import { parseDueDate, parseId, parseTitle } from "../lib/form";
import { TASK_GONE, type ActionResult } from "../types/tasks";

const TITLE_REQUIRED = "Type a task first.";
const BAD_DUE_DATE = "Pick a valid due date.";
const UNEXPECTED = "Could not save. Try again.";

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

  let changed: number;
  try {
    changed = getDb()
      .prepare("UPDATE tasks SET title = ?, due_date = ? WHERE id = ?")
      .run(title.value, dueDate.value, id.value).changes;
  } catch (error) {
    console.error("updateTask failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (changed === 0) return taskGone();
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
