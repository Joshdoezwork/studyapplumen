import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Bot, CalendarDays, CheckSquare, Flame, Gamepad2,
  LineChart, NotebookPen, Target, Timer,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lumen" },
      { name: "description", content: "Your study dashboard: goals, streaks, upcoming work, and progress." },
    ],
  }),
  component: Dashboard,
});

const cards = [
  { to: "/planner" as const, label: "Planner", desc: "Schedule study, assignments, exams.", icon: CalendarDays },
  { to: "/tutor" as const, label: "AI Tutor", desc: "Ask, explain, summarize, quiz.", icon: Bot },
  { to: "/games" as const, label: "Quiz Games", desc: "Subject-by-subject practice.", icon: Gamepad2 },
  { to: "/notes" as const, label: "Notes", desc: "Capture ideas fast.", icon: NotebookPen },
  { to: "/tasks" as const, label: "Goals", desc: "Tiny wins, every day.", icon: CheckSquare },
  { to: "/pomodoro" as const, label: "Focus", desc: "25-minute work blocks.", icon: Timer },
  { to: "/analytics" as const, label: "Analytics", desc: "Strengths & weaknesses.", icon: LineChart },
];

type Session = { started_at: string; minutes: number };
type Event = { id: string; title: string; subject: string | null; type: string; starts_at: string };
type Score = { score: number; total: number; created_at: string };

function Dashboard() {
  const { profile, user } = useAuth();
  const name = profile?.display_name ?? "learner";

  const [greeting, setGreeting] = useState("Hello");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [goal, setGoal] = useState<number>(30);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("30");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 5 ? "Still awake" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const [s, e, q, g] = await Promise.all([
        supabase.from("study_sessions").select("started_at, minutes").eq("user_id", user.id).gte("started_at", since),
        supabase.from("planner_events").select("id, title, subject, type, starts_at").eq("user_id", user.id).gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
        supabase.from("quiz_scores").select("score, total, created_at").eq("user_id", user.id).gte("created_at", since),
        supabase.from("study_goals").select("daily_minutes_target").eq("user_id", user.id).maybeSingle(),
      ]);
      setSessions((s.data as Session[]) ?? []);
      setEvents((e.data as Event[]) ?? []);
      setScores((q.data as Score[]) ?? []);
      if (g.data?.daily_minutes_target) {
        setGoal(g.data.daily_minutes_target);
        setGoalInput(String(g.data.daily_minutes_target));
      }
    })();
  }, [user]);

  const todayMinutes = useMemo(() => {
    const day = new Date().toDateString();
    return sessions.filter((s) => new Date(s.started_at).toDateString() === day)
      .reduce((sum, s) => sum + s.minutes, 0);
  }, [sessions]);

  const weekMinutes = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400_000;
    return sessions.filter((s) => new Date(s.started_at).getTime() >= cutoff)
      .reduce((sum, s) => sum + s.minutes, 0);
  }, [sessions]);

  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => new Date(s.started_at).toDateString()));
    let count = 0;
    const d = new Date();
    while (days.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [sessions]);

  const avgScore = useMemo(() => {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, s) => sum + s.score / s.total, 0) / scores.length;
  }, [scores]);

  const goalPct = Math.min(100, Math.round((todayMinutes / Math.max(1, goal)) * 100));

  const saveGoal = async () => {
    if (!user) return;
    const n = Math.max(5, Math.min(480, Number(goalInput) || 30));
    const { error } = await supabase.from("study_goals").upsert({ user_id: user.id, daily_minutes_target: n });
    if (error) { toast.error("Couldn't save goal"); return; }
    setGoal(n);
    setEditingGoal(false);
    toast.success("Goal updated");
  };

  return (
    <div className="pb-32 md:pb-0">
      <section className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground" suppressHydrationWarning>{greeting}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
          What will you learn tonight,{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{name}</span>?
        </h1>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Today's goal</span>
            {!editingGoal && (
              <button onClick={() => setEditingGoal(true)} className="text-[10px] underline hover:text-foreground">edit</button>
            )}
          </div>
          {editingGoal ? (
            <div className="mt-2 flex items-center gap-2">
              <input type="number" min={5} max={480} value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="w-20 rounded-md border border-border bg-white/5 px-2 py-1 text-sm" />
              <span className="text-xs text-muted-foreground">min</span>
              <button onClick={saveGoal} className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">Save</button>
            </div>
          ) : (
            <>
              <div className="mt-2 font-display text-3xl font-semibold">{todayMinutes}<span className="text-base text-muted-foreground">/{goal} min</span></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${goalPct}%` }} />
              </div>
            </>
          )}
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><Flame className="h-3.5 w-3.5" /> Streak</div>
          <div className="mt-2 font-display text-3xl font-semibold">{streak} <span className="text-base text-muted-foreground">day{streak === 1 ? "" : "s"}</span></div>
          <p className="mt-2 text-xs text-muted-foreground">{streak === 0 ? "Start a focus session to begin." : "Keep it lit — log a session today."}</p>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><Timer className="h-3.5 w-3.5" /> This week</div>
          <div className="mt-2 font-display text-3xl font-semibold">{weekMinutes}<span className="text-base text-muted-foreground"> min</span></div>
          <p className="mt-2 text-xs text-muted-foreground">{Math.round(weekMinutes / 60 * 10) / 10}h of study</p>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><ListChecks className="h-3.5 w-3.5" /> Quiz avg</div>
          <div className="mt-2 font-display text-3xl font-semibold">{scores.length ? Math.round(avgScore * 100) : "—"}<span className="text-base text-muted-foreground">{scores.length ? "%" : ""}</span></div>
          <p className="mt-2 text-xs text-muted-foreground">{scores.length} quiz{scores.length === 1 ? "" : "zes"} (30d)</p>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="glass-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Upcoming</h2>
            <Link to="/planner" className="text-xs text-muted-foreground hover:text-foreground">Open planner →</Link>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled. Add assignments and exams in the Planner.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{e.subject ?? "—"} · {e.type}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Jump in</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link to="/tutor" className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Ask the AI Tutor <Bot className="h-4 w-4" /></Link>
            <Link to="/pomodoro" className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Start a focus block <Timer className="h-4 w-4" /></Link>
            <Link to="/games" className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Play a quiz round <Gamepad2 className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to} className="glass-panel group relative overflow-hidden p-5 transition hover:border-primary/40">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">{c.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
