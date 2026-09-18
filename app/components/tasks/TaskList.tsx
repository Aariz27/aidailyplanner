"use client";

import { useState } from "react";
import AddTaskForm from "./AddTaskForm";
import TaskRow from "./TaskRow";
import type { Step, Task } from "../../types/db";
import type { ActionResult } from "../../types/tasks";

export default function TaskList({
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
  const [notice, setNotice] = useState<string | null>(null);

  function handleResult(result: ActionResult) {
    setNotice(result.success ? null : result.error);
  }

  return (
    <>
      <AddTaskForm onResult={handleResult} />
      {notice && (
        <p role="alert" className="px-2 text-xs text-warn">
          {notice}
        </p>
      )}
      {tasks.length === 0 ? (
        <p className="px-2 text-[13px] text-muted">No tasks yet. Dump one above.</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              steps={stepsByTask[task.id] ?? []}
              hasPriority={tasksWithPriorities.includes(task.id)}
              alreadyToday={todayTaskIds.includes(task.id)}
              todayStepIds={todayStepIds}
              todayFull={todayFull}
              onResult={handleResult}
            />
          ))}
        </ul>
      )}
    </>
  );
}
