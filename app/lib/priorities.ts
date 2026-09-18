import { getDb } from "./db";
import type { Step, TodayPriority } from "../types/db";

// Built from the local parts, because toISOString() is UTC and would roll the day over
// in the evening.
export function todayDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function listTodayPriorities(today: string): TodayPriority[] {
  return getDb()
    .prepare(
      `SELECT p.id, p.priority_date, p.task_id, p.step_id, p.done, p.status,
              t.title AS task_title, t.due_date AS task_due_date,
              s.title AS step_title, s.position AS step_position
       FROM daily_priorities p
       JOIN tasks t ON t.id = p.task_id
       LEFT JOIN steps s ON s.id = p.step_id
       WHERE p.priority_date = ?
       ORDER BY p.id`,
    )
    .all(today) as TodayPriority[];
}

// A task only carries a status colour once it has been a daily priority at least once.
export function listTaskIdsWithPriorities(): number[] {
  const rows = getDb().prepare("SELECT DISTINCT task_id FROM daily_priorities").all() as {
    task_id: number;
  }[];
  return rows.map((row) => row.task_id);
}

// The steps of every task that has a step card today, so a card can draw the whole
// progression. A done task's steps are not in the Dumped list's own query.
export function listStepsForTodayPriorities(today: string): Step[] {
  return getDb()
    .prepare(
      `SELECT s.id, s.task_id, s.position, s.title, s.done
       FROM steps s
       WHERE s.task_id IN (
         SELECT task_id FROM daily_priorities WHERE priority_date = ? AND step_id IS NOT NULL
       )
       ORDER BY s.task_id, s.position`,
    )
    .all(today) as Step[];
}
