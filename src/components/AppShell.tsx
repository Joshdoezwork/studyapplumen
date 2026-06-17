import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CheckSquare, Layers, NotebookPen, Sparkles, Timer } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: Sparkles },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/tasks", label: "Goals", icon: CheckSquare },
  { to: "/pomodoro", label: "Focus", icon: Timer },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="aurora-bg relative min-h-screen w-full">
      {/* Aurora ambience */}
      <div
        className="aurora-blob"
        style={{
          width: 520,
          height: 520,
          background: "var(--color-aurora-1)",
          top: -120,
          left: -100,
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 460,
          height: 460,
          background: "var(--color-aurora-2)",
          top: 200,
          right: -120,
          animationDelay: "-6s",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 380,
          height: 380,
          background: "var(--color-aurora-3)",
          bottom: -120,
          left: "30%",
          animationDelay: "-12s",
        }}
      />
      <div className="starfield" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-8">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Lumen
            </span>
          </Link>

          <nav className="glass-panel hidden items-center gap-1 px-2 py-1.5 md:flex">
            {nav.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        {/* mobile bottom nav */}
        <nav className="glass-panel fixed inset-x-4 bottom-4 z-20 flex items-center justify-around px-2 py-2 md:hidden">
          {nav.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
