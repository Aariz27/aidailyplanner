import TaskList from "./TaskList";
import type { Step, Task } from "../../types/db";

export default function TaskDumpList({
  tasks,
  stepsByTask,
  tasksWithPriorities,
  todayTaskIds,
  todayStepIds,
  todayFull,
}: {
  tasks: Task[];
  stepsByTask: Record<number, Step[]>;
  tasksWithPriorities: number[];
  todayTaskIds: number[];
  todayStepIds: number[];
  todayFull: boolean;
}) {
  return (
    <section aria-labelledby="dumped-heading" className="ext-lg flex flex-col gap-[18px] p-6">
      {/* pl-[11px] puts the 44px circle on the same centre line as the row icons below. */}
      <div className="flex items-center gap-3.5 pl-[11px]">
        <div className="circle-inset flex h-11 w-11 shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] fill-none stroke-text"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
        </div>
        <div>
          <h2 id="dumped-heading" className="text-[15px] font-semibold">
            Dumped
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
      </div>
      <TaskList
        tasks={tasks}
        stepsByTask={stepsByTask}
        tasksWithPriorities={tasksWithPriorities}
        todayTaskIds={todayTaskIds}
        todayStepIds={todayStepIds}
        todayFull={todayFull}
      />
    </section>
  );
}
