export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseTitle(formData: FormData, emptyError: string): Parsed<string> {
  const raw = formData.get("title");
  const title = typeof raw === "string" ? raw.trim() : "";
  return title ? { ok: true, value: title } : { ok: false, error: emptyError };
}

export function parseDueDate(formData: FormData, badError: string): Parsed<string | null> {
  const raw = formData.get("due_date");
  if (raw === null || raw === "") return { ok: true, value: null };
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, error: badError };
  }
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? { ok: true, value: raw } : { ok: false, error: badError };
}

export function parseId(formData: FormData, field: string, missingError: string): Parsed<number> {
  const raw = formData.get(field);
  const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : 0;
  return Number.isSafeInteger(id) && id > 0 ? { ok: true, value: id } : { ok: false, error: missingError };
}
