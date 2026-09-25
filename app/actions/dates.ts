"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../lib/db";
import { parseDueDate, parseId } from "../lib/form";
import { DATE_GONE, type ActionResult } from "../types/tasks";

const LABEL_REQUIRED = "Type a label first.";
const BAD_DATE = "Pick a valid date.";
const UNEXPECTED = "Could not save. Try again.";

function dateGone(): ActionResult {
  revalidatePath("/", "layout");
  return { success: false, error: DATE_GONE };
}

export async function createImportantDate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = formData.get("label");
  const label = typeof raw === "string" ? raw.trim() : "";
  if (!label) return { success: false, error: LABEL_REQUIRED };
  // The date is required here, so an empty field is refused like a malformed one.
  const onDate = parseDueDate(formData, BAD_DATE, "on_date");
  if (!onDate.ok || onDate.value === null) return { success: false, error: BAD_DATE };

  try {
    getDb().prepare("INSERT INTO important_dates (label, on_date) VALUES (?, ?)").run(label, onDate.value);
  } catch (error) {
    console.error("createImportantDate failed", error);
    return { success: false, error: UNEXPECTED };
  }
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteImportantDate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = parseId(formData, "id", DATE_GONE);
  if (!id.ok) return dateGone();

  let changed: number;
  try {
    changed = getDb().prepare("DELETE FROM important_dates WHERE id = ?").run(id.value).changes;
  } catch (error) {
    console.error("deleteImportantDate failed", error);
    return { success: false, error: UNEXPECTED };
  }
  if (changed === 0) return dateGone();
  revalidatePath("/", "layout");
  return { success: true };
}
