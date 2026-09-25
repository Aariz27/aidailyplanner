export const PILL = "ext-sm rounded-xl px-3.5 py-2 text-[11px] font-semibold whitespace-nowrap active:pressed";

// The label says why a "Set as daily priority" button is greyed out, since the reason is
// otherwise only shown in another column.
export function priorityLabel(alreadyToday: boolean, todayFull: boolean, label = "Set as daily priority") {
  if (alreadyToday) return "Already today";
  if (todayFull) return "Today is full";
  return label;
}
