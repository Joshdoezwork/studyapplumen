import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Paperclip, Plus, Search, Trash2, X, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes — Lumen" },
      { name: "description", content: "Rich study notes with PDFs and images, organized by subject and searchable." },
      { property: "og:title", content: "Notes — Lumen" },
      { property: "og:description", content: "Rich study notes with PDFs and images, organized by subject." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notes,
});

type Attachment = { path: string; name: string; type: string; size: number };
type Note = {
  id: string;
  title: string;
  body: string;
  subject: string;
  attachments: Attachment[];
  updated_at: string;
};

const SUBJECTS = [
  { id: "general", label: "General", color: "bg-muted-foreground" },
  { id: "math", label: "Math", color: "bg-sky-400" },
  { id: "english", label: "English", color: "bg-rose-400" },
  { id: "science", label: "Science", color: "bg-emerald-400" },
  { id: "sst", label: "Social Studies", color: "bg-amber-400" },
  { id: "bible", label: "Bible", color: "bg-violet-400" },
];
const subjectOf = (id: string) => SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];

function Notes() {
  // Local mirror: used offline and by the AI tutor / quiz generator
  const [cache, setCache] = useLocalStorage<Note[]>("lumen.notes", []);
  const [notes, setNotes] = useState<Note[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id ?? null;
      setUserId(uid);
      const { data, error } = await supabase
        .from("notes")
        .select("id,title,body,subject,attachments,updated_at")
        .order("updated_at", { ascending: false });
      if (error) {
        setOffline(true);
        setNotes(cache.map((n) => ({ ...n, subject: n.subject ?? "general", attachments: n.attachments ?? [], updated_at: n.updated_at ?? new Date().toISOString() })));
      } else {
        let rows = (data ?? []) as unknown as Note[];
        // One-time import of older device-only notes
        const legacy = cache.filter((n) => !rows.some((r) => r.id === n.id) && !/^[0-9a-f-]{36}$/.test(n.id));
        if (uid && legacy.length) {
          const { data: ins } = await supabase
            .from("notes")
            .insert(legacy.map((n) => ({ user_id: uid, title: n.title, body: n.body, subject: "general" })))
            .select("id,title,body,subject,attachments,updated_at");
          rows = [...((ins ?? []) as unknown as Note[]), ...rows];
        }
        setNotes(rows);
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded) setCache(notes);
    if (loaded && !activeId && notes[0]) setActiveId(notes[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, loaded]);

  const active = notes.find((n) => n.id === activeId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (filter !== "all" && n.subject !== filter) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.attachments.some((a) => a.name.toLowerCase().includes(q))
      );
    });
  }, [notes, query, filter]);

  const add = async () => {
    if (!userId) return toast.error("Sign in to create notes");
    const subject = filter === "all" ? "general" : filter;
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: userId, subject })
      .select("id,title,body,subject,attachments,updated_at")
      .single();
    if (error) return toast.error(error.message);
    setNotes([data as unknown as Note, ...notes]);
    setActiveId(data.id);
  };

  const update = (patch: Partial<Note>) => {
    if (!active) return;
    const id = active.id;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n)));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from("notes").update(patch as never).eq("id", id);
      if (error) toast.error("Couldn't save: " + error.message);
    }, 600);
  };

  const remove = async (id: string) => {
    const n = notes.find((x) => x.id === id);
    if (!confirm("Delete this note and its files?")) return;
    if (n?.attachments.length) await supabase.storage.from("note-files").remove(n.attachments.map((a) => a.path));
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    const next = notes.filter((x) => x.id !== id);
    setNotes(next);
    if (id === activeId) setActiveId(next[0]?.id ?? "");
  };

  const upload = async (files: FileList | null) => {
    if (!files || !active || !userId) return;
    setUploading(true);
    const added: Attachment[] = [];
    for (const f of Array.from(files)) {
      if (!(f.type === "application/pdf" || f.type.startsWith("image/"))) {
        toast.error(`${f.name}: only PDFs and images`);
        continue;
      }
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name}: max 20 MB`); continue; }
      const path = `${userId}/${active.id}/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("note-files").upload(path, f, { contentType: f.type });
      if (error) { toast.error(error.message); continue; }
      added.push({ path, name: f.name, type: f.type, size: f.size });
    }
    if (added.length) update({ attachments: [...active.attachments, ...added] });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = async (a: Attachment) => {
    if (!active) return;
    await supabase.storage.from("note-files").remove([a.path]);
    update({ attachments: active.attachments.filter((x) => x.path !== a.path) });
  };

  return (
    <div className="grid gap-6 pb-24 md:grid-cols-[300px_1fr] md:pb-0">
      <aside className="glass-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</h2>
          <button onClick={add} className="grid h-7 w-7 place-items-center rounded-md bg-primary/20 hover:bg-primary/30" aria-label="New note">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {offline && (
          <p className="mb-2 flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 text-xs text-muted-foreground">
            <WifiOff className="h-3 w-3" /> Offline — showing saved copy
          </p>
        )}
        <label className="relative mb-2 block">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes & files…"
            aria-label="Search notes"
            className="w-full rounded-md border border-border bg-background/40 py-2 pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div className="mb-3 flex flex-wrap gap-1">
          {[{ id: "all", label: "All" }, ...SUBJECTS].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition ${filter === s.id ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <ul className="max-h-[55vh] space-y-1 overflow-y-auto">
          {filtered.map((n) => (
            <li key={n.id} className="group flex items-center gap-1">
              <button
                onClick={() => setActiveId(n.id)}
                className={`flex-1 truncate rounded-md px-3 py-2 text-left text-sm transition ${n.id === activeId ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${subjectOf(n.subject).color}`} />
                  <span className="truncate">{n.title || "Untitled"}</span>
                  {n.attachments.length > 0 && <Paperclip className="h-3 w-3 shrink-0" />}
                </span>
                <span className="block truncate text-xs text-muted-foreground/70">{n.body.slice(0, 40) || "Empty"}</span>
              </button>
              <button onClick={() => remove(n.id)} className="rounded-md p-1.5 text-muted-foreground opacity-0 hover:text-destructive focus:opacity-100 group-hover:opacity-100" aria-label="Delete note">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {loaded && filtered.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">{notes.length ? "No matches." : "No notes yet — add one above."}</p>
          )}
        </ul>
      </aside>

      {active ? (
        <div className="glass-panel flex min-h-[60vh] flex-col p-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={active.title}
              onChange={(e) => update({ title: e.target.value })}
              className="min-w-0 flex-1 bg-transparent font-display text-2xl font-semibold outline-none placeholder:text-muted-foreground"
              placeholder="Note title"
              aria-label="Note title"
            />
            <select
              value={active.subject}
              onChange={(e) => update({ subject: e.target.value })}
              aria-label="Subject"
              className="rounded-md border border-border bg-background/60 px-2 py-1.5 text-sm"
            >
              {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <textarea
            value={active.body}
            onChange={(e) => update({ body: e.target.value })}
            placeholder="Start writing… (markdown works)"
            aria-label="Note body"
            className="mt-4 min-h-[240px] flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />

          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Files</h3>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || offline}
                className="flex items-center gap-1.5 rounded-md bg-primary/20 px-3 py-1.5 text-xs hover:bg-primary/30 disabled:opacity-50"
              >
                <Paperclip className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Add PDF / image"}
              </button>
              <input ref={fileRef} type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
            </div>
            {active.attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No files attached.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {active.attachments.map((a) => <FileCard key={a.path} a={a} onRemove={() => removeFile(a)} />)}
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {subjectOf(active.subject).label} · Saved {new Date(active.updated_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="glass-panel grid place-items-center py-20 text-muted-foreground">
          {loaded ? "Create a note to begin." : "Loading…"}
        </div>
      )}
    </div>
  );
}

function FileCard({ a, onRemove }: { a: Attachment; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("note-files").createSignedUrl(a.path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [a.path]);
  const isImg = a.type.startsWith("image/");
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-background/40">
      <a href={url ?? undefined} target="_blank" rel="noreferrer" className="block">
        {isImg && url ? (
          <img src={url} alt={a.name} className="h-28 w-full object-cover" />
        ) : (
          <div className="grid h-28 place-items-center text-muted-foreground">
            {isImg ? <ImageIcon className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
          </div>
        )}
        <p className="truncate px-2 py-1.5 text-xs">{a.name}</p>
      </a>
      <button onClick={onRemove} aria-label={`Remove ${a.name}`} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 hover:text-destructive focus:opacity-100 group-hover:opacity-100">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
