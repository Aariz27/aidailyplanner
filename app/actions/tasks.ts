"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../lib/db";
import { TASK_GONE, type ActionResult } from "../types/tasks";

const TITLE_REQUIRED = "Type a task first.";
const BAD_DUE_DATE = "Pick a valid due date.";
const UNEXPECTED = "Could not save. Try again.";

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function parseTitle(formData: FormData): Parsed<string> {
  const raw = formData.get("title");
  const title = typeof raw === "string" ? raw.trim() : "";
  return title ? { ok: true, value: title } : { ok: false, error: TITLE_REQUIRED };
}

function parseDueDate(formData: FormData): Parsed<string | null> {
  const raw = formData.get("due_date");
  if (raw === null || raw === "") return { ok: true, value: null };
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, error: BAD_DUE_DATE };
  }
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? { ok: true, value: raw } : { ok: false, error: BAD_DUE_DATE };
}

function parseId(formData: FormData): Parsed<number> {
  const raw = formData.get("id");
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : 0;
  return Number.isSafeInteger(id) && id > 0 ? { ok: true, value: id } : { ok: false, error: TASK_GONE };
}

function taskGone(): ActionResult {
  revalidatePath("/");
  return { success: false, error: TASK_GONE };
}

export async function createTask(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const title = parseTitle(formData);
  if (!title.ok) return { success: false, error: title.error };
  const dueDate = parseDueDate(formData);
  if (!dueDate.ok) return { success: false, error: dueDate.error };

  try {
    getDb().prepare("INSERT INTO tasks (title, due_date) VALUES (?, ?)").run(title.value, dueDate.value);
  } catch (error) {
    console.error("createTask failed", error);
    return { success: false, error: UNEXPECTED };
  }
  revalidatePath("/");
  return { success: true };
}

export async function updateTask(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = parseId(formData);
  if (!id.ok) return taskGone();
  const title = parseTitle(formData);
  if (!title.ok) return { success: false, error: title.error };
  const dueDate = parseDueDate(formData);
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
  revalidatePath("/");
  return { success: true };
}

export async function deleteTask(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = parseId(formData);
  if (!id.ok) return taskGone();

  let changed: number;
  try {
    changed = getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id.value).changes;
  } catch (error) {
    console.error("deleteTask failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (changed === 0) return taskGone();
  revalidatePath("/");
  return { success: true };
}
