"use client";

import { useState } from "react";
import PriorityCard from "./PriorityCard";
import type { Step, TodayPriority } from "../../types/db";
import type { ActionResult } from "../../types/tasks";

const MAX_PER_DAY = 3;

export default function TodayColumn({
  priorities,
  stepsByTask,
}: {
  priorities: TodayPriority[];
  stepsByTask: Record<number, Step[]>;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const count = priorities.length;
  const freeSlots = Math.max(0, MAX_PER_DAY - count);

  function handleResult(result: ActionResult) {
    setNotice(result.success ? null : result.error);
  }

  return (
    <section aria-label="Today's daily priorities" className="flex flex-col gap-5">
      {notice && (
        <p role="alert" className="px-2 text-xs text-warn">
          {notice}
        </p>
      )}

      {count > 0 && (
        <ul className="flex flex-col gap-5">
          {priorities.map((priority) => (
            <PriorityCard
              key={priority.id}
              priority={priority}
              steps={stepsByTask[priority.task_id] ?? []}
              onResult={handleResult}
            />
          ))}
        </ul>
      )}

      {Array.from({ length: freeSlots }, (_, index) => (
        <div
          key={index}
          className="inset-lg flex min-h-[70px] items-center justify-center px-5 py-[18px] text-xs text-muted"
        >
          Choose a task or a step
        </div>
      ))}

      {count === MAX_PER_DAY && (
        <p className="text-center text-xs text-muted">
          3 of 3 daily priorities set. Finish or remove one to add another.
        </p>
      )}
    </section>
  );
}
