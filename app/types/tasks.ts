export type ActionResult = { success: true } | { success: false; error: string };

// Shared so the list can show this message after the missing task's row has already disappeared.
export const TASK_GONE = "That task no longer exists.";
export const STEP_GONE = "That step no longer exists.";
