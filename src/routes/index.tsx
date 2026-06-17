import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckSquare, Layers, NotebookPen, Timer } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Your study night sky" },
      {
        name: "description",
        content:
          "A calm dashboard for flashcards, notes, focus sessions, and study goals.",
      },
    ],
  }),
  component: Dashboard,
});

const cards = [
  {
    to: "/flashcards" as const,
    label: "Flashcards",
    desc: "Build decks. Flip and learn.",
    icon: Layers,
  },
  {
    to: "/notes" as const,
    label: "Notes",
    desc: "Capture ideas as they spark.",
    icon: NotebookPen,
  },
  {
    to: "/tasks" as const,
    label: "Goals",
    desc: "Tiny wins, every day.",
    icon: CheckSquare,
  },
  {
    to: "/pomodoro" as const,
    label: "Focus",
    desc: "25 minutes of quiet work.",
    icon: Timer,
  },
];

function Dashboard() {
  const [name] = useLocalStorage<string>("lumen.name", "learner");
  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Still awake" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="pb-24 md:pb-0">
      <section className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          {greeting}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
          What will you learn tonight, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{name}</span>?
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          A quiet workspace for thinkers of every age. Pick a tool and begin —
          everything you make stays right here on your device.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="glass-panel group relative overflow-hidden p-6 transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{c.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
            </Link>
          );
        })}
      </section>

      <section className="mt-10">
        <div className="glass-panel p-6">
          <h2 className="font-display text-lg font-semibold">A small ritual</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Open one deck. Write one note. Set a 25-minute timer. The night is
            patient.
          </p>
        </div>
      </section>
    </div>
  );
}
