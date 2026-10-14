import type { RepeatUnit, Task } from "../types/db";

// A recurring task's rule, in the shape the Repeat picker edits. Dates are "YYYY-MM-DD".
export interface RepeatRule {
  unit: RepeatUnit;
  every: number;
  // Weekdays for a weekly rule, 0 = Sunday ... 6 = Saturday.
  days: number[];
  until: string | null;
}

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS = [1, 2, 3, 4, 5];

export function ruleFromTask(task: Pick<Task, "repeat_unit" | "repeat_every" | "repeat_days" | "repeat_until">): RepeatRule | null {
  if (!task.repeat_unit) return null;
  return {
    unit: task.repeat_unit,
    every: task.repeat_every,
    days: task.repeat_days ? task.repeat_days.split(",").map(Number) : [],
    until: task.repeat_until,
  };
}

// Days since 1970-01-01, so date gaps never trip over time zones or clock changes.
function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function weekdayOf(date: string): number {
  // 1970-01-01 was a Thursday.
  return (((dayNumber(date) + 4) % 7) + 7) % 7;
}

// Whether the rule, counted from `start` (the day it was set), puts the task on `date`.
export function isDue(rule: RepeatRule, start: string, date: string): boolean {
  if (date < start || (rule.until && date > rule.until)) return false;
  if (rule.unit === "day") return (dayNumber(date) - dayNumber(start)) % rule.every === 0;
  if (rule.unit === "week") {
    if (!rule.days.includes(weekdayOf(date))) return false;
    const weekStart = (d: string) => dayNumber(d) - weekdayOf(d);
    return ((weekStart(date) - weekStart(start)) / 7) % rule.every === 0;
  }
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [year, month, day] = date.split("-").map(Number);
  const months = (year - startYear) * 12 + (month - startMonth);
  return day === startDay && months % rule.every === 0;
}

export function sameRule(a: RepeatRule | null, b: RepeatRule | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const presets = (today: string): { key: string; label: string; rule: RepeatRule | null }[] => [
  { key: "none", label: "Does not repeat", rule: null },
  { key: "daily", label: "Daily", rule: { unit: "day", every: 1, days: [], until: null } },
  { key: "weekdays", label: "Weekdays", rule: { unit: "week", every: 1, days: WEEKDAYS, until: null } },
  {
    key: "weekly",
    label: `Weekly on ${WEEKDAY_SHORT[weekdayOf(today)]}`,
    rule: { unit: "week", every: 1, days: [weekdayOf(today)], until: null },
  },
];

const plural = (count: number, word: string) => (count === 1 ? word : `${count} ${word}s`);

// Plain words for the rule, like Google Calendar: "Daily", "Every weekday", "Every 2 weeks on Mon, Wed".
export function describeRule(rule: RepeatRule, start: string | null): string {
  let text: string;
  const days = [...rule.days].sort();
  if (rule.unit === "day") text = rule.every === 1 ? "Daily" : `Every ${plural(rule.every, "day")}`;
  else if (rule.unit === "week") {
    const onDays = days.map((day) => WEEKDAY_SHORT[day]).join(", ");
    if (rule.every === 1 && days.join(",") === WEEKDAYS.join(",")) text = "Every weekday";
    else if (rule.every === 1 && days.length === 7) text = "Daily";
    else if (rule.every === 1 && days.length === 1) text = `Weekly on ${WEEKDAY_LONG[days[0]]}`;
    else text = `${rule.every === 1 ? "Weekly" : `Every ${plural(rule.every, "week")}`} on ${onDays}`;
  } else {
    const day = start ? Number(start.slice(8)) : null;
    text = `${rule.every === 1 ? "Monthly" : `Every ${plural(rule.every, "month")}`}${day ? ` on day ${day}` : ""}`;
  }
  if (rule.until) {
    const [year, month, day] = rule.until.split("-");
    text += `, until ${day}.${month}.${year}`;
  }
  return text;
}

// Today in the browser's local time, for the picker's labels (lib/priorities reads the database).
export function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
