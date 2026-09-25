"use client";

import { useState } from "react";
import ProgressionsDialog from "../tasks/ProgressionsDialog";
import { PILL } from "../tasks/pill";
import type { Step, Task } from "../../types/db";
import type { ActionResult } from "../../types/tasks";

export default function AddProgressionsButton({
  task,
  steps,
  todayStepIds,
  todayFull,
}: {
  task: Task;
  steps: Step[];
  todayStepIds: number[];
  todayFull: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function handleResult(result: ActionResult) {
    setNotice(result.success ? null : result.error);
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={(event) => {
          // Safari does not focus a clicked button, and the pop-up returns focus to whatever had it.
          event.currentTarget.focus();
          setOpen(true);
        }}
        className={PILL}
      >
        Add progressions
      </button>
      {notice && (
        <p role="alert" className="text-xs text-warn">
          {notice}
        </p>
      )}
      {open && (
        <ProgressionsDialog
          task={task}
          steps={steps}
          todayStepIds={todayStepIds}
          todayFull={todayFull}
          onClose={() => setOpen(false)}
          onResult={handleResult}
        />
      )}
    </div>
  );
}
