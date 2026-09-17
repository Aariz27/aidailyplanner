// Splits the stored YYYY-MM-DD string instead of using Date, so the day never shifts with the timezone.
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-");
  return `${day}.${month}.${year}`;
}
