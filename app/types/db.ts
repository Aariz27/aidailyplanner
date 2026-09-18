export type TaskStatus = "open" | "started" | "done";

export interface Task {
  id: number;
  title: string;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface Step {
  id: number;
  task_id: number;
  position: number;
  title: string;
  done: 0 | 1;
}

export interface DailyPriority {
  id: number;
  priority_date: string;
  task_id: number;
  step_id: number | null;
  done: 0 | 1;
  status: TaskStatus;
}

// One daily priority with the task, and the step when one was chosen, read in a single query.
export interface TodayPriority extends DailyPriority {
  task_title: string;
  task_due_date: string | null;
  step_title: string | null;
  step_position: number | null;
}

export interface ImportantDate {
  id: number;
  label: string;
  on_date: string;
}

// One item started on an earlier day and not finished, for the right sidebar.
export interface StartedItem {
  task_id: number;
  step_id: number | null;
  chosen_date: string;
  task_title: string;
  task_due_date: string | null;
  step_title: string | null;
  step_position: number | null;
  step_count: number;
}
