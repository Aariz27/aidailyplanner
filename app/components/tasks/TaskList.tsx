"use client";

import { useState } from "react";
import AddTaskForm from "./AddTaskForm";
import TaskRow from "./TaskRow";
import type { Task } from "../../types/db";
import type { ActionResult } from "../../types/tasks";

export default function TaskList({ tasks }: { tasks: Task[] }) {
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
            <TaskRow key={task.id} task={task} onResult={handleResult} />
          ))}
        </ul>
      )}
    </>
  );
}
