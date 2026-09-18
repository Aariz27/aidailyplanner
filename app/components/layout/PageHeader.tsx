import type { ReactNode } from "react";
import ThemeToggle from "../theme/ThemeToggle";
import TabNav, { type Tab } from "./TabNav";
import { longDate } from "../../lib/dates";
import { countDoneTasks } from "../../lib/tasks";

// Masthead, tabs and today's date on the left; `aside` fills the top right corner.
export default function PageHeader({ active, today, aside }: { active: Tab; today: string; aside?: ReactNode }) {
  return (
    <>
      <div className="mb-7 flex justify-end">
        <ThemeToggle />
      </div>
      <header className="mb-9 flex items-start justify-between gap-7">
        <div>
          <h1 className="mb-[18px] text-[56px] leading-none whitespace-nowrap">
            <span className="masthead-outline font-normal text-transparent">DAILY</span>
            <span className="font-medium tracking-[.02em]">PLANNER</span>
          </h1>
          <TabNav active={active} doneCount={countDoneTasks()} />
          <p className="mt-3.5 ml-1 text-sm text-muted">{longDate(today)}</p>
        </div>
        {aside}
      </header>
    </>
  );
}
