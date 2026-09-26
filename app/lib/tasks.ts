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
      "SELECT s.id, s.task_id, s.position, s.title, s.done, s.parent_id FROM steps s JOIN tasks t ON t.id = s.task_id WHERE t.status != 'done' ORDER BY s.task_id, s.position",
    )
    .all() as Step[];
}

// Every task of every status, for the Strategy tab.
export function listAllTasks(): Task[] {
  return getDb()
    .prepare("SELECT id, title, due_date, status, created_at FROM tasks ORDER BY id DESC")
    .all() as Task[];
}

export function listAllSteps(): Step[] {
  return getDb()
    .prepare("SELECT id, task_id, position, title, done, parent_id FROM steps ORDER BY task_id, position")
    .all() as Step[];
}

export function countDoneTasks(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS count FROM tasks WHERE status = 'done'").get() as {
    count: number;
  };
  return row.count;
}

export function listDoneTasks(): Task[] {
  return getDb()
    .prepare("SELECT id, title, due_date, status, created_at FROM tasks WHERE status = 'done' ORDER BY id DESC")
    .all() as Task[];
}

export function listStepsForDoneTasks(): Step[] {
  return getDb()
    .prepare(
      "SELECT s.id, s.task_id, s.position, s.title, s.done, s.parent_id FROM steps s JOIN tasks t ON t.id = s.task_id WHERE t.status = 'done' ORDER BY s.task_id, s.position",
    )
    .all() as Step[];
}
