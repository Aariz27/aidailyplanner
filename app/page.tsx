import PageHeader from "./components/layout/PageHeader";
import TaskDumpList from "./components/tasks/TaskDumpList";
import TodayColumn from "./components/priorities/TodayColumn";
import TodayGauge from "./components/priorities/TodayGauge";
import StartedList from "./components/priorities/StartedList";
import DatesBox from "./components/dates/DatesBox";
import { daysBetween, listImportantDates } from "./lib/dates";
import { listDumpTasks, listStepsForDumpTasks } from "./lib/tasks";
import {
  listStepsForTodayPriorities,
  listStartedNotCompleted,
  listTaskIdsWithPriorities,
  listTodayPriorities,
  todayDate,
} from "./lib/priorities";
import type { Step } from "./types/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const tasks = listDumpTasks();
  const today = todayDate();
  const priorities = listTodayPriorities(today);
  const started = listStartedNotCompleted(today);
  const dates = listImportantDates(today).map((date) => ({ ...date, days: daysBetween(today, date.on_date) }));
  const tasksWithPriorities = listTaskIdsWithPriorities();
  const todayTaskIds = priorities.filter((row) => row.step_id === null).map((row) => row.task_id);
  const todayStepIds = priorities
    .map((row) => row.step_id)
    .filter((stepId): stepId is number => stepId !== null);
  const stepsByTask: Record<number, Step[]> = {};
  for (const step of [...listStepsForDumpTasks(), ...listStepsForTodayPriorities(today)]) {
    const steps = (stepsByTask[step.task_id] ??= []);
    // A task can come from both queries; keep one copy of each step.
    if (!steps.some((existing) => existing.id === step.id)) steps.push(step);
  }

  return (
    <main className="mx-auto max-w-[1280px] p-12">
      <PageHeader active="overview" today={today} aside={<DatesBox dates={dates} />} />
      <div className="grid grid-cols-[1fr_1.25fr_1fr] items-start gap-7">
        <TaskDumpList
          tasks={tasks}
          stepsByTask={stepsByTask}
          tasksWithPriorities={tasksWithPriorities}
          todayTaskIds={todayTaskIds}
          todayStepIds={todayStepIds}
          todayFull={priorities.length >= 3}
        />
        <TodayColumn priorities={priorities} stepsByTask={stepsByTask} />
        <div className="flex flex-col gap-7">
          <TodayGauge priorities={priorities} />
          <StartedList items={started} todayFull={priorities.length >= 3} />
        </div>
      </div>
    </main>
  );
}
