import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bot, BookOpen, CalendarDays, CheckSquare, Gamepad2, LineChart,
  LogOut, NotebookPen, Sparkles, Timer,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/", label: "Home", icon: Sparkles },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/tutor", label: "Tutor", icon: Bot },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/tasks", label: "Goals", icon: CheckSquare },
  { to: "/pomodoro", label: "Focus", icon: Timer },
  { to: "/analytics", label: "Stats", icon: LineChart },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="aurora-bg relative min-h-screen w-full">
      <div className="aurora-blob" style={{ width: 520, height: 520, background: "var(--color-aurora-1)", top: -120, left: -100 }} />
      <div className="aurora-blob" style={{ width: 460, height: 460, background: "var(--color-aurora-2)", top: 200, right: -120, animationDelay: "-6s" }} />
      <div className="aurora-blob" style={{ width: 380, height: 380, background: "var(--color-aurora-3)", bottom: -120, left: "30%", animationDelay: "-12s" }} />
      <div className="starfield" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-8">
        <header className="mb-8 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Lumen</span>
          </Link>

          <nav className="glass-panel hidden flex-wrap items-center gap-1 px-2 py-1.5 lg:flex">
            {nav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    active ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400" : "bg-rose-400"}`} title={online ? "Online" : "Offline"} />
            {profile && (
              <span className="hidden text-xs text-muted-foreground md:inline">
                {profile.display_name ?? "Learner"} · G{profile.grade}
              </span>
            )}
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <nav className="glass-panel fixed inset-x-4 bottom-4 z-20 flex items-center gap-0.5 overflow-x-auto px-1 py-2 lg:hidden">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
