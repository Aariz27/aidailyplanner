import PageHeader from "../components/layout/PageHeader";
import TaskProgression from "../components/strategy/TaskProgression";
import AddProgressionsButton from "../components/strategy/AddProgressionsButton";
import { listAllSteps, listAllTasks } from "../lib/tasks";
import { listTodayPriorities, todayDate } from "../lib/priorities";
import type { Step } from "../types/db";

export const dynamic = "force-dynamic";

export default function StrategyPage() {
  const today = todayDate();
  const tasks = listAllTasks();
  const priorities = listTodayPriorities(today);
  const todayStepIds = priorities
    .map((row) => row.step_id)
    .filter((stepId): stepId is number => stepId !== null);
  const todayFull = priorities.length >= 3;
  const stepsByTask: Record<number, Step[]> = {};
  for (const step of listAllSteps()) (stepsByTask[step.task_id] ??= []).push(step);

  return (
    <main className="mx-auto max-w-[1280px] p-12">
      <PageHeader active="strategy" today={today} />
      {tasks.length === 0 ? (
        <p className="text-[13px] text-muted">No tasks yet. Dump one on the Overview tab.</p>
      ) : (
        <div className="flex flex-col gap-7">
          {tasks.map((task) => (
            <TaskProgression
              key={task.id}
              task={task}
              steps={stepsByTask[task.id] ?? []}
              action={
                <AddProgressionsButton
                  task={task}
                  steps={stepsByTask[task.id] ?? []}
                  todayStepIds={todayStepIds}
                  todayFull={todayFull}
                />
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
