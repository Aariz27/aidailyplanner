import { getDb } from "./db";
import type { ImportantDate } from "../types/db";

// Upcoming dates first, soonest first, then passed dates, most recent first.
export function listImportantDates(today: string): ImportantDate[] {
  return getDb()
    .prepare(
      `SELECT id, label, on_date FROM important_dates
       ORDER BY on_date < ?, CASE WHEN on_date < ? THEN on_date END DESC, on_date, id`,
    )
    .all(today, today) as ImportantDate[];
}

function utcDay(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

// Whole days from one YYYY-MM-DD date to another, negative when `to` has passed.
// Built from the date parts in UTC, so a timezone or clock change never shifts it.
export function daysBetween(from: string, to: string): number {
  return Math.round((utcDay(to) - utcDay(from)) / 86_400_000);
}

// "Friday 18 September 2026".
export function longDate(date: string): string {
  return new Date(utcDay(date))
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .replace(",", "");
}
