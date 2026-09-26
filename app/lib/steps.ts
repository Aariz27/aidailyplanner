import type Database from "better-sqlite3";

// A step with sub-progressions is done exactly when all of them are done. Called after any
// change to a sub-progression; a parent with no sub-progressions left keeps its own tick.
export function syncParentDone(db: Database.Database, parentId: number | null): void {
  if (parentId === null) return;
  db.prepare(
    `UPDATE steps SET done = (SELECT MIN(c.done) FROM steps c WHERE c.parent_id = steps.id)
     WHERE id = ? AND EXISTS (SELECT 1 FROM steps c WHERE c.parent_id = steps.id)`,
  ).run(parentId);
}

export function parentOf(db: Database.Database, stepId: number): number | null {
  const row = db.prepare("SELECT parent_id FROM steps WHERE id = ?").get(stepId) as
    | { parent_id: number | null }
    | undefined;
  return row?.parent_id ?? null;
}
