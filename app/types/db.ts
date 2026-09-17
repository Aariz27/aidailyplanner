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
}

export interface ImportantDate {
  id: number;
  label: string;
  on_date: string;
}
