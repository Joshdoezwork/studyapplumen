import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Goals — Lumen" },
      { name: "description", content: "Track your daily study goals." },
    ],
  }),
  component: Tasks,
});

type Task = { id: string; text: string; done: boolean; createdAt: number };
const uid = () => Math.random().toString(36).slice(2, 9);

function Tasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("lumen.tasks", []);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setTasks([
      { id: uid(), text: text.trim(), done: false, createdAt: Date.now() },
      ...tasks,
    ]);
    setText("");
  };

  const toggle = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? (done / tasks.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="font-display text-3xl font-semibold">Goals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Small steps make bright stars.
        </p>
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress today</span>
          <span className="font-medium">
            {done} / {tasks.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="glass-panel flex items-center gap-2 p-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a study goal…"
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="glass-panel group flex items-center gap-3 p-3"
          >
            <button
              onClick={() => toggle(t.id)}
              className={`grid h-6 w-6 place-items-center rounded-md border transition ${
                t.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              }`}
              aria-label="Toggle"
            >
              {t.done && <Check className="h-3.5 w-3.5" />}
            </button>
            <span
              className={`flex-1 text-sm ${
                t.done ? "text-muted-foreground line-through" : ""
              }`}
            >
              {t.text}
            </span>
            <button
              onClick={() => remove(t.id)}
              className="rounded-md p-1.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="glass-panel grid place-items-center p-10 text-sm text-muted-foreground">
            No goals yet. Add one to begin.
          </li>
        )}
      </ul>
    </div>
  );
}
