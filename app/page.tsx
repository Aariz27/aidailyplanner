import ThemeToggle from "./components/theme/ThemeToggle";
import TaskDumpList from "./components/tasks/TaskDumpList";
import { listDumpTasks, listStepsForDumpTasks } from "./lib/tasks";
import type { Step } from "./types/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const tasks = listDumpTasks();
  const stepsByTask: Record<number, Step[]> = {};
  for (const step of listStepsForDumpTasks()) {
    (stepsByTask[step.task_id] ??= []).push(step);
  }

  return (
    <main className="mx-auto max-w-[1280px] p-12">
      <div className="mb-7 flex justify-end">
        <ThemeToggle />
      </div>
      <div className="grid grid-cols-[1fr_1.25fr_1fr] items-start gap-7">
        <TaskDumpList tasks={tasks} stepsByTask={stepsByTask} />
      </div>
    </main>
  );
}
