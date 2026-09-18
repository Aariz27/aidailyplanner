import Link from "next/link";

export type Tab = "overview" | "strategy";

const TABS: { id: Tab; label: string; href: string }[] = [
  { id: "overview", label: "Overview", href: "/" },
  { id: "strategy", label: "Strategy", href: "/strategy" },
];

export default function TabNav({ active }: { active: Tab }) {
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
          </Link>
        );
      })}
    </nav>
  );
}
