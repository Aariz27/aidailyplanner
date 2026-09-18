import Link from "next/link";

export type Tab = "overview" | "strategy" | "completed";

const TABS: { id: Tab; label: string; href: string }[] = [
  { id: "overview", label: "Overview", href: "/" },
  { id: "strategy", label: "Strategy", href: "/strategy" },
  { id: "completed", label: "Completed", href: "/completed" },
];

export default function TabNav({ active, doneCount }: { active: Tab; doneCount: number }) {
  return (
    <nav aria-label="Tabs" className="ext-sm inline-flex gap-1 p-1.5">
      {TABS.map((tab) => {
        const current = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            className={`flex items-center gap-2 rounded-[14px] px-[22px] py-2.5 text-sm font-semibold ${
              current ? "inset-lg text-text" : "text-muted"
            }`}
          >
            {tab.label}
            {tab.id === "completed" && doneCount > 0 && (
              <>
                <span className="sr-only">, {doneCount === 1 ? "1 task" : `${doneCount} tasks`}</span>
                <span
                  aria-hidden="true"
                  className="ext-sm flex h-5 min-w-5 items-center justify-center rounded-full px-[5px] text-[11px] font-semibold"
                >
                  {doneCount}
                </span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
