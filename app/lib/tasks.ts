import { getDb } from "./db";
import type { Task } from "../types/db";

export function listDumpTasks(): Task[] {
  return getDb()
    .prepare(
      "SELECT id, title, due_date, status, created_at FROM tasks WHERE status != 'done' ORDER BY id DESC",
    )
    .all() as Task[];
}
