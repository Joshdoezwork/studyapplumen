import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SUBJECTS } from "@/lib/quiz-data";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Planner — Lumen" },
      { name: "description", content: "Plan study sessions, assignments, and exams." },
    ],
  }),
  component: PlannerPage,
});

type PlannerEvent = {
  id: string;
  title: string;
  subject: string | null;
  type: string;
  starts_at: string;
  ends_at: string | null;
  notes: string | null;
  color: string | null;
};

const TYPE_COLOR: Record<string, string> = {
  study: "#7c9cff",
  assignment: "#f59e0b",
  exam: "#ef4444",
  other: "#a78bfa",
};

const SUBJECT_OPTS = SUBJECTS.map((s) => s.name);

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function fmtDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PlannerPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlannerEvent | null>(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<string>("");
  const [type, setType] = useState<string>("study");
  const [startsAt, setStartsAt] = useState(fmtDateInput(new Date()));
  const [notes, setNotes] = useState("");

  const load = async () => {
    if (!user) return;
    const from = startOfMonth(cursor);
    const to = new Date(endOfMonth(cursor).getTime() + 86400_000);
    const { data, error } = await supabase
      .from("planner_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString())
      .order("starts_at");
    if (error) { toast.error(error.message); return; }
    setEvents((data as PlannerEvent[]) ?? []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, cursor]);

  const { perm, request: requestNotif } = useNotificationPermission();

  const monthGrid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startDay = first.getDay();
    const daysInMonth = endOfMonth(cursor).getDate();
    const cells: { date: Date | null; events: PlannerEvent[] }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null, events: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      const ds = date.toDateString();
      cells.push({ date, events: events.filter((e) => new Date(e.starts_at).toDateString() === ds) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, events: [] });
    return cells;
  }, [cursor, events]);

  const upcoming = useMemo(
    () => events.filter((e) => new Date(e.starts_at).getTime() >= Date.now()).slice(0, 10),
    [events],
  );

  const resetForm = () => {
    setEditing(null);
    setTitle(""); setSubject(""); setType("study");
    setStartsAt(fmtDateInput(new Date())); setNotes("");
  };

  const openNew = (date?: Date) => {
    resetForm();
    if (date) setStartsAt(fmtDateInput(date));
    setShowForm(true);
  };

  const openEdit = (e: PlannerEvent) => {
    setEditing(e);
    setTitle(e.title);
    setSubject(e.subject ?? "");
    setType(e.type);
    setStartsAt(fmtDateInput(new Date(e.starts_at)));
    setNotes(e.notes ?? "");
    setShowForm(true);
  };

  const save = async () => {
    if (!user || !title.trim()) return;
    const payload = {
      user_id: user.id,
      title: title.trim(),
      subject: subject || null,
      type,
      starts_at: new Date(startsAt).toISOString(),
      notes: notes || null,
      color: TYPE_COLOR[type],
    };
    const q = editing
      ? supabase.from("planner_events").update(payload).eq("id", editing.id)
      : supabase.from("planner_events").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated" : "Added");
    setShowForm(false);
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("planner_events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEvents((cur) => cur.filter((e) => e.id !== id));
  };

  return (
    <div className="pb-32 md:pb-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> Study Planner
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">
            {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white/5 hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setCursor(new Date())}
            className="rounded-lg border border-border bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">Today</button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white/5 hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => openNew()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Event
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="glass-panel p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wider text-muted-foreground">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((cell, i) => {
              const isToday = cell.date && cell.date.toDateString() === new Date().toDateString();
              return (
                <button
                  key={i}
                  disabled={!cell.date}
                  onClick={() => cell.date && openNew(cell.date)}
                  className={`group relative min-h-[80px] rounded-lg border p-1.5 text-left text-xs transition ${
                    !cell.date ? "border-transparent" :
                    isToday ? "border-primary/60 bg-primary/10" :
                    "border-border bg-white/5 hover:border-primary/40"
                  }`}
                >
                  {cell.date && <div className="mb-1 text-[11px] font-medium text-muted-foreground">{cell.date.getDate()}</div>}
                  <div className="space-y-0.5">
                    {cell.events.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                        className="truncate rounded px-1 py-0.5 text-[10px] text-white"
                        style={{ background: e.color ?? TYPE_COLOR[e.type] ?? "#7c9cff" }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {cell.events.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{cell.events.length - 3} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-4">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing on the horizon. Tap a day to add.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="group rounded-lg border border-border bg-white/5 p-2.5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => openEdit(e)} className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: e.color ?? TYPE_COLOR[e.type] }} />
                        <span className="font-medium">{e.title}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(e.starts_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        {e.subject ? ` · ${e.subject}` : ""} · {e.type}
                      </div>
                    </button>
                    <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="glass-panel w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-display text-xl font-semibold">{editing ? "Edit event" : "New event"}</h3>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 outline-none focus:border-primary/60" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Type</span>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-border bg-white/5 px-3 py-2">
                    <option value="study">Study</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Subject</span>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-border bg-white/5 px-3 py-2">
                    <option value="">— none —</option>
                    {SUBJECT_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Date & time</span>
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-lg border border-border bg-white/5 px-3 py-2" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Notes</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-border bg-white/5 px-3 py-2" />
              </label>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2">
              {editing ? (
                <button onClick={() => { remove(editing.id); setShowForm(false); }} className="text-xs text-destructive hover:underline">Delete</button>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-border bg-white/5 px-3 py-1.5 text-sm">Cancel</button>
                <button onClick={save} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
