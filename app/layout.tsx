import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Planner",
  description: "Dump tasks and pick today's three daily priorities",
};

// Runs before first paint so a saved dark choice never flashes light first.
const THEME_SCRIPT = `try{if(localStorage.getItem("planner-theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
