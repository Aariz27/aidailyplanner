import { getDb } from "./db";
import { todayDate } from "./priorities";
import { isDue, ruleFromTask } from "./repeat";
import type { Task } from "../types/db";

const MAX_PER_DAY = 3;

// Runs before each page reads its data. Every recurring task due today that has not been
// handled today is reopened and added to today's daily priorities, if a slot is free. It is
// marked as handled either way, so a task removed from today is not added back on reload.
export function applyRecurrence(today: string = todayDate()): void {
  const db = getDb();
  const tasks = db
    .prepare(
      `SELECT id, repeat_unit, repeat_every, repeat_days, repeat_start, repeat_until FROM tasks
       WHERE repeat_unit IS NOT NULL AND (last_recurred IS NULL OR last_recurred < ?)`,
    )
    .all(today) as Pick<Task, "id" | "repeat_unit" | "repeat_every" | "repeat_days" | "repeat_start" | "repeat_until">[];

  const due = tasks.filter((task) => {
    const rule = ruleFromTask(task);
    return rule !== null && task.repeat_start !== null && isDue(rule, task.repeat_start, today);
  });
  if (due.length === 0) return;

  db.transaction(() => {
    for (const task of due) {
      db.prepare("UPDATE tasks SET status = 'open', last_recurred = ? WHERE id = ?").run(today, task.id);
      const listed = db
        .prepare("SELECT 1 FROM daily_priorities WHERE priority_date = ? AND task_id = ? AND step_id IS NULL")
        .get(today, task.id);
      const { count } = db
        .prepare("SELECT COUNT(*) AS count FROM daily_priorities WHERE priority_date = ?")
        .get(today) as { count: number };
      if (!listed && count < MAX_PER_DAY) {
        db.prepare("INSERT INTO daily_priorities (priority_date, task_id, step_id) VALUES (?, ?, NULL)").run(
          today,
          task.id,
        );
      }
    }
  })();
}
