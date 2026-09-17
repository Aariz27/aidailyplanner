const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Splits the stored YYYY-MM-DD string instead of using Date, so the day never shifts with the timezone.
export function formatDueDate(dueDate: string): string {
  const [, month, day] = dueDate.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`;
}
