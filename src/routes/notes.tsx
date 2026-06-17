import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes — Lumen" },
      { name: "description", content: "Quick notes for your study sessions." },
    ],
  }),
  component: Notes,
});

type Note = { id: string; title: string; body: string; updatedAt: number };

const uid = () => Math.random().toString(36).slice(2, 9);

function Notes() {
  const [notes, setNotes] = useLocalStorage<Note[]>("lumen.notes", []);
  const [activeId, setActiveId] = useState<string>(notes[0]?.id ?? "");
  const active = notes.find((n) => n.id === activeId);

  const add = () => {
    const n: Note = {
      id: uid(),
      title: "Untitled note",
      body: "",
      updatedAt: Date.now(),
    };
    setNotes([n, ...notes]);
    setActiveId(n.id);
  };

  const update = (patch: Partial<Note>) => {
    if (!active) return;
    setNotes(
      notes.map((n) =>
        n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n,
      ),
    );
  };

  const remove = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    if (id === activeId) setActiveId(next[0]?.id ?? "");
  };

  return (
    <div className="grid gap-6 pb-24 md:grid-cols-[280px_1fr] md:pb-0">
      <aside className="glass-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </h2>
          <button
            onClick={add}
            className="grid h-7 w-7 place-items-center rounded-md bg-primary/20 hover:bg-primary/30"
            aria-label="New note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-1">
          {notes.map((n) => (
            <li key={n.id} className="group flex items-center gap-1">
              <button
                onClick={() => setActiveId(n.id)}
                className={`flex-1 truncate rounded-md px-3 py-2 text-left text-sm transition ${
                  n.id === activeId
                    ? "bg-primary/20 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <span className="block truncate">{n.title || "Untitled"}</span>
                <span className="block truncate text-xs text-muted-foreground/70">
                  {n.body.slice(0, 40) || "Empty"}
                </span>
              </button>
              <button
                onClick={() => remove(n.id)}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {notes.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No notes yet — add one above.
            </p>
          )}
        </ul>
      </aside>

      {active ? (
        <div className="glass-panel flex min-h-[60vh] flex-col p-6">
          <input
            value={active.title}
            onChange={(e) => update({ title: e.target.value })}
            className="w-full bg-transparent font-display text-2xl font-semibold outline-none placeholder:text-muted-foreground"
            placeholder="Note title"
          />
          <textarea
            value={active.body}
            onChange={(e) => update({ body: e.target.value })}
            placeholder="Start writing…"
            className="mt-4 flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Saved {new Date(active.updatedAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="glass-panel grid place-items-center py-20 text-muted-foreground">
          Create a note to begin.
        </div>
      )}
    </div>
  );
}
