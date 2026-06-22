import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as LineIcon, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getStudySuggestion } from "@/lib/analytics.functions";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Lumen" },
      { name: "description", content: "Track study minutes, quiz accuracy, and your strengths." },
    ],
  }),
  component: AnalyticsPage,
});

type Session = { started_at: string; minutes: number };
type Score = { subject: string; score: number; total: number; created_at: string };

function AnalyticsPage() {
  const { user, profile } = useAuth();
  const suggest = useServerFn(getStudySuggestion);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [suggestion, setSuggestion] = useState<string>("");
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 60 * 86400_000).toISOString();
      const [s, q] = await Promise.all([
        supabase.from("study_sessions").select("started_at, minutes").eq("user_id", user.id).gte("started_at", since),
        supabase.from("quiz_scores").select("subject, score, total, created_at").eq("user_id", user.id).gte("created_at", since),
      ]);
      setSessions((s.data as Session[]) ?? []);
      setScores((q.data as Score[]) ?? []);
    })();
  }, [user]);

  const weekMinutes = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400_000;
    return sessions.filter((s) => new Date(s.started_at).getTime() >= cutoff).reduce((a, b) => a + b.minutes, 0);
  }, [sessions]);

  const monthMinutes = useMemo(
    () => sessions.filter((s) => new Date(s.started_at).getTime() >= Date.now() - 30 * 86400_000).reduce((a, b) => a + b.minutes, 0),
    [sessions],
  );

  const dailyChart = useMemo(() => {
    const days: { day: string; minutes: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const mins = sessions.filter((s) => new Date(s.started_at).toDateString() === ds).reduce((a, b) => a + b.minutes, 0);
      days.push({ day: d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }), minutes: mins });
    }
    return days;
  }, [sessions]);

  const bySubject = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    scores.forEach((s) => {
      const key = s.subject.split(":")[0];
      const cur = map.get(key) ?? { sum: 0, count: 0 };
      map.set(key, { sum: cur.sum + s.score / s.total, count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .map(([subject, v]) => ({ subject, avg: v.sum / v.count, count: v.count, pct: Math.round((v.sum / v.count) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  }, [scores]);

  const avgScore = useMemo(() => {
    if (scores.length === 0) return 0;
    return scores.reduce((s, c) => s + c.score / c.total, 0) / scores.length;
  }, [scores]);

  const strengths = bySubject.slice(0, 2);
  const weaknesses = [...bySubject].sort((a, b) => a.pct - b.pct).slice(0, 2);

  const askSuggestion = async () => {
    setLoadingSuggest(true);
    try {
      const r = await suggest({
        data: {
          weeklyMinutes: weekMinutes,
          quizzes: scores.length,
          avgScore,
          bySubject: bySubject.map((b) => ({ subject: b.subject, avg: b.avg, count: b.count })),
          grade: profile?.grade ?? 9,
        },
      });
      setSuggestion(r.suggestion);
    } catch (e) {
      setSuggestion("Couldn't load suggestion: " + (e as Error).message);
    } finally {
      setLoadingSuggest(false);
    }
  };

  return (
    <div className="pb-32 md:pb-0">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          <LineIcon className="h-4 w-4" /> Performance Analytics
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">How you're doing</h1>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="This week" value={`${weekMinutes} min`} sub={`${Math.round(weekMinutes / 60 * 10) / 10}h`} />
        <Stat label="Last 30 days" value={`${monthMinutes} min`} sub={`${Math.round(monthMinutes / 60 * 10) / 10}h`} />
        <Stat label="Quiz accuracy" value={scores.length ? `${Math.round(avgScore * 100)}%` : "—"} sub={`${scores.length} quizzes`} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Study minutes — last 14 days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChart}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "rgba(15,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="minutes" stroke="oklch(0.72 0.18 280)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Accuracy by subject</h3>
          {bySubject.length === 0 ? (
            <p className="text-sm text-muted-foreground">Take some quizzes to see this chart.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySubject}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "rgba(15,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Bar dataKey="pct" fill="oklch(0.72 0.18 280)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Strengths</h3>
          {strengths.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
            <ul className="space-y-2 text-sm">
              {strengths.map((s) => (
                <li key={s.subject} className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2">
                  <span className="capitalize">{s.subject}</span>
                  <span className="font-display font-semibold text-emerald-300">{s.pct}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass-panel p-5">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Focus areas</h3>
          {weaknesses.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
            <ul className="space-y-2 text-sm">
              {weaknesses.map((s) => (
                <li key={s.subject} className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2">
                  <span className="capitalize">{s.subject}</span>
                  <span className="font-display font-semibold text-amber-300">{s.pct}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI suggestion</h3>
          <button onClick={askSuggestion} disabled={loadingSuggest}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loadingSuggest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {suggestion ? "Regenerate" : "Get suggestion"}
          </button>
        </div>
        {suggestion ? (
          <p className="text-sm leading-relaxed">{suggestion}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Click "Get suggestion" for a personalized study coach paragraph based on your data.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass-panel p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
