import { getDb } from "./db";
import type { Step, Task } from "../types/db";

export function listDumpTasks(): Task[] {
  return getDb()
    .prepare(
      "SELECT id, title, due_date, status, created_at FROM tasks WHERE status != 'done' ORDER BY id DESC",
    )
    .all() as Task[];
}

export function listStepsForDumpTasks(): Step[] {
  return getDb()
    .prepare(
      "SELECT s.id, s.task_id, s.position, s.title, s.done FROM steps s JOIN tasks t ON t.id = s.task_id WHERE t.status != 'done' ORDER BY s.task_id, s.position",
    )
    .all() as Step[];
}
